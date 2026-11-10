import { useState, useRef, useMemo, useEffect } from 'react';
import {
  X, Calendar, Tag, AlertCircle, AlignLeft, Sparkles, ChevronDown, Check,
  Paperclip, MessageSquare, Send, Repeat, Clock, Folder, UserPlus, Link as LinkIcon,
  Bell, Lock, CheckCircle2, Trash2, Plus, Mic, MapPin, Navigation, ExternalLink
} from 'lucide-react';
import { collection, addDoc, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { PLAN_LIMITS, isApexPlan } from '../utils/planLimits';

const CustomDropdown = ({ options, value, onChange, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = (e) => {
    e.stopPropagation();
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange?.(next);
  };
  const handleSelect = (opt, e) => {
    e.stopPropagation();
    onChange(opt);
    setIsOpen(false);
    onOpenChange?.(false);
  };
  const handleClose = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-left text-gray-800 dark:text-white font-medium flex justify-between items-center outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={handleClose}></div>
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-y-auto max-h-48 hide-scrollbar">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={(e) => handleSelect(opt, e)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium flex justify-between items-center"
              >
                <span>{opt}</span>
                {value === opt && <Check size={16} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function TaskForm({
  onClose,
  taskToEdit,
  user,
  showToast,
  prefilledDate,
  _allAssignees = [],
  prefilledProject = '',
  prefilledPriority = '',
  allProjects = [],
  activeWorkspaceId = '',
  isApex: isApexProp = false,
  onOpenApexModal,
  onNotifyTeammate,
  onNotifyTaskEdit,
  currentWorkspace = 'personal',
  connections = []
}) {
  const isApex = Boolean(isApexProp || isApexPlan(user?.plan));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fileInputRef = useRef(null);

  // Segregated project choices based on active workspace
  const workspaceProjectChoices = useMemo(() => {
    if (currentWorkspace === 'personal') {
      const personalList = allProjects.filter(p => p.type === 'personal' || !p.type);
      const names = personalList.map(p => p.name).filter(Boolean);
      return Array.from(new Set(['Personal Inbox', ...names]));
    } else {
      const teamList = allProjects.filter(p => p.type === 'team');
      const names = teamList.map(p => p.name).filter(Boolean);
      return names.length > 0 ? names : ['Team Workspace'];
    }
  }, [allProjects, currentWorkspace]);

  const initialProject = taskToEdit?.project || prefilledProject || (currentWorkspace === 'personal' ? 'Personal Inbox' : (workspaceProjectChoices[0] || 'Team Workspace'));
  const initialAssignee = currentWorkspace === 'personal'
    ? (user?.displayName || 'Me')
    : (taskToEdit?.assignee || user?.displayName || 'Me');

  const [task, setTask] = useState(() => ({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    priority: taskToEdit?.priority || prefilledPriority || 'Medium',
    category: taskToEdit?.category || 'Work',
    project: initialProject,
    assignee: initialAssignee,
    deadline: taskToEdit?.deadline || prefilledDate || '',
    startTime: taskToEdit?.startTime || '',
    endTime: taskToEdit?.endTime || '',
    attachmentLink: taskToEdit?.attachmentLink || '',
    attachmentName: taskToEdit?.attachmentName || '',
    status: taskToEdit?.status || 'To Do',
    pinned: !!taskToEdit?.pinned,
    comments: taskToEdit?.comments || [],
    steps: Array.isArray(taskToEdit?.steps) ? taskToEdit.steps : [],
    recurrence: taskToEdit?.recurrence || 'None',
    durationMinutes: taskToEdit?.durationMinutes || 45,
    reminders: Array.isArray(taskToEdit?.reminders) ? taskToEdit.reminders : ['At due time'],
    locationReminder: taskToEdit?.locationReminder || '',
    voiceNote: taskToEdit?.voiceNote || ''
  }));

  const [newStepText, setNewStepText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef('');

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const parseVoiceRamble = (rawText, currentTask) => {
    const cleaned = (rawText || '').trim();
    if (!cleaned) return null;

    let title = currentTask.title || '';
    let description = currentTask.description || '';
    let priority = currentTask.priority || 'Medium';
    let dueDate = currentTask.dueDate;

    const lower = cleaned.toLowerCase();

    // 1. Detect priority keywords
    if (/\b(urgent|critical|p1)\b/i.test(lower)) {
      priority = 'Urgent';
    } else if (/\b(high priority|important|p2)\b/i.test(lower)) {
      priority = 'High';
    } else if (/\b(low priority|p4)\b/i.test(lower)) {
      priority = 'Low';
    }

    // 2. Detect due date keywords
    const now = new Date();
    if (/\b(due tomorrow|tomorrow)\b/i.test(lower)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
    } else if (/\b(due today|today)\b/i.test(lower)) {
      dueDate = now.toISOString().split('T')[0];
    } else if (/\b(next week)\b/i.test(lower)) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDate = nextWeek.toISOString().split('T')[0];
    }

    // 3. Strip metadata tags from candidate title
    let candidate = cleaned
      .replace(/\b(due tomorrow|due today|next week|tomorrow|today)\b/gi, '')
      .replace(/\b(high priority|low priority|urgent priority|urgent|critical|priority medium)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!candidate) candidate = cleaned;

    if (!title.trim() || title.trim().length <= 2) {
      // If user spoke multiple sentences (e.g., "Math homework. Do pages 40 to 45.")
      const sentences = candidate.split(/[.!?]\s+/).filter(Boolean);
      if (sentences.length > 1) {
        title = sentences[0].trim();
        const extraNotes = sentences.slice(1).join('. ').trim();
        description = description ? `${description}\n\n${extraNotes}` : extraNotes;
      } else {
        title = candidate;
      }
      // Capitalize first letter of title
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      // Title already set, update description without repeating prefixes
      const curDesc = (description || '').trim();
      if (!curDesc) {
        description = cleaned;
      } else if (curDesc.includes(cleaned)) {
        description = curDesc;
      } else if (cleaned.includes(curDesc)) {
        description = cleaned;
      } else {
        description = `${curDesc}\n\n${cleaned}`;
      }
    }

    return {
      title,
      description,
      priority,
      dueDate,
      voiceNote: cleaned
    };
  };

  const handleVoiceRamble = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast?.("Speech recognition is not available in this browser window. Please type directly.", "warning");
      return;
    }

    if (isRecordingVoice) {
      // User tapped Stop
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecordingVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      transcriptBufferRef.current = '';
      setLiveTranscript('');

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        showToast?.("🎙️ Voice Ramble active... Speak your task naturally.", "info");
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript + ' ';
          }
        }
        const combined = (finalText + interimText).trim();
        transcriptBufferRef.current = combined;
        setLiveTranscript(combined);
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition error:', e);
        setIsRecordingVoice(false);
        setLiveTranscript('');
        if (e.error !== 'no-speech') {
          showToast?.("Microphone error or permission not granted.", "error");
        }
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
        const finalSpoken = transcriptBufferRef.current.trim();
        if (finalSpoken) {
          setTask(prev => {
            const parsed = parseVoiceRamble(finalSpoken, prev);
            return parsed ? { ...prev, ...parsed } : prev;
          });
          showToast?.("✨ Voice Ramble parsed into task!", "success");
        }
        setLiveTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecordingVoice(false);
      showToast?.("Could not start voice recognition.", "error");
    }
  };

  const maxSteps = isApex ? (PLAN_LIMITS.APEX.subtasksPerTask || Infinity) : (PLAN_LIMITS.CORE.subtasksPerTask || 5);
  const currentStepsCount = (task.steps || []).length;
  const isStepLimitReached = !isApex && currentStepsCount >= maxSteps;

  const handleToggleStep = (stepId) => {
    setTask(prev => ({
      ...prev,
      steps: (prev.steps || []).map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
    }));
  };

  const handleAddStep = (e) => {
    if (e) {
      if (e.key && e.key !== 'Enter') return;
      e.preventDefault();
    }
    const trimmed = newStepText.trim();
    if (!trimmed) return;

    if (isStepLimitReached) {
      showToast?.(`Core plan allows up to ${maxSteps} subtasks per task. Upgrade to Apex Prestige for unlimited subtasks.`, "warning");
      onOpenApexModal?.();
      return;
    }

    const newStep = {
      id: 'step_' + Date.now(),
      title: trimmed,
      completed: false
    };
    setTask(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
    setNewStepText('');
  };

  const handleDeleteStep = (stepId) => {
    setTask(prev => ({
      ...prev,
      steps: (prev.steps || []).filter(s => s.id !== stepId)
    }));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast?.("Geolocation not supported by this browser.", "warning");
      return;
    }
    showToast?.("Detecting GPS coordinates...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordsStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setTask(prev => ({
          ...prev,
          locationCoords: { lat: latitude, lng: longitude },
          locationAddress: prev.locationAddress || `Current GPS Pin (${coordsStr})`
        }));
        showToast?.(`📍 GPS Pin Captured: ${coordsStr} (200m Geofence Active)`, "success");
      },
      () => {
        showToast?.("Could not retrieve GPS location. Please check browser permissions.", "warning");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // UPLOAD LOGIC with Apex limits (100MB for Apex vs 5MB for Core)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = isApex ? 100 : 5;
    if (file.size > maxMb * 1024 * 1024) {
      showToast(
        `${isApex ? 'Apex' : 'Core'} limit exceeded. Max file size is ${maxMb} MB. ${!isApex ? 'Apex Prestige unlocks 100 MB uploads.' : ''}`,
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTask(prev => ({ ...prev, attachmentLink: reader.result, attachmentName: file.name }));
      showToast(`File "${file.name}" attached successfully!`, "success");
    };
    reader.readAsDataURL(file);
  };

  // Smart heuristic decomposition or breakdown
  const handleAIBreakdown = () => {
    const title = task.title.trim();
    if (!title) {
      showToast("Please enter a task title first to generate breakdown steps.", "warning");
      return;
    }

    const remainingSlots = isApex ? Infinity : Math.max(0, maxSteps - (task.steps || []).length);
    if (remainingSlots <= 0) {
      showToast?.(`Core tier limit reached (${maxSteps}/${maxSteps} subtasks). Upgrade to Apex for unlimited subtasks.`, "warning");
      onOpenApexModal?.();
      return;
    }

    const lower = title.toLowerCase();
    let generatedSteps;
    if (lower.includes('study') || lower.includes('learn') || lower.includes('read') || lower.includes('dsa') || lower.includes('exam')) {
      generatedSteps = [
        `Review core concepts and theory for ${title}`,
        `Solve 3-5 practice problems / exercises`,
        `Summarize key takeaways and tricky edge cases`,
        `Self-quiz or review flashcards`
      ];
    } else if (lower.includes('assign') || lower.includes('homework') || lower.includes('project')) {
      generatedSteps = [
        `Review requirements & rubric for ${title}`,
        `Draft initial outline and approach`,
        `Implement main solution / write draft`,
        `Test, proofread, and verify final deliverables`
      ];
    } else if (lower.includes('bug') || lower.includes('fix') || lower.includes('debug')) {
      generatedSteps = [
        `Reproduce issue and check error logs`,
        `Identify root cause in code`,
        `Implement fix and test edge cases`,
        `Deploy and verify in production`
      ];
    } else {
      generatedSteps = [
        `Plan approach and gather resources for ${title}`,
        `Execute first milestone / core implementation`,
        `Review progress, test, and refine details`,
        `Finalize and mark as complete`
      ];
    }

    let toAdd = generatedSteps;
    if (!isApex && toAdd.length > remainingSlots) {
      toAdd = toAdd.slice(0, remainingSlots);
    }

    const newSteps = toAdd.map((stepTitle, idx) => ({
      id: 'step_' + Date.now() + '_' + idx,
      title: stepTitle,
      completed: false
    }));

    setTask(prev => ({
      ...prev,
      steps: [...(prev.steps || []), ...newSteps]
    }));
    
    if (!isApex && generatedSteps.length > remainingSlots) {
      showToast(`Added ${newSteps.length} subtasks (Core limit of ${maxSteps} reached). Upgrade to Apex for unlimited subtasks!`, "info");
    } else {
      showToast(`Generated ${newSteps.length} breakdown steps!`, "success");
    }
  };

  // Immediate Team Activity Comment Posting
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const commentObj = {
      text: newComment.trim(),
      date: new Date().toLocaleString(),
      author: user?.displayName || 'User'
    };
    const updatedComments = [...(task.comments || []), commentObj];
    setTask(prev => ({ ...prev, comments: updatedComments }));
    setNewComment('');

    // If editing an existing task, save instantly!
    if (taskToEdit?.id && user?.uid) {
      if (user.isGuest) {
        try {
          const saved = JSON.parse(localStorage.getItem('tb_guest_tasks') || '[]');
          const updated = saved.map(t => t.id === taskToEdit.id ? { ...t, comments: updatedComments } : t);
          localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
          window.dispatchEvent(new Event('tb_guest_tasks_updated'));
          showToast("Comment posted to team!", "success");
        } catch {
          showToast("Failed to save comment locally.", "error");
        }
      } else {
        try {
          let updatedInCloud = false;

          // 1. If task belongs to a team project, sync comment to projects/{projectId}/tasks/{taskId}
          const matchedProj = allProjects?.find(p =>
            p.type === 'team' && (
              (taskToEdit.projectId && p.id === taskToEdit.projectId) ||
              (typeof taskToEdit.project === 'string' && typeof p.name === 'string' && taskToEdit.project.trim().toLowerCase() === p.name.trim().toLowerCase())
            )
          );

          if (matchedProj) {
            try {
              await updateDoc(doc(db, 'projects', matchedProj.id, 'tasks', taskToEdit.id), {
                comments: updatedComments
              });
              updatedInCloud = true;
            } catch (pErr) {
              console.warn("Project comment update error:", pErr);
            }
          }

          if (!updatedInCloud) {
            const targetWsId = taskToEdit.workspaceId || activeWorkspaceId;
            if (targetWsId && targetWsId !== 'local_workspace') {
              try {
                await updateDoc(doc(db, 'workspaces', targetWsId, 'tasks', taskToEdit.id), {
                  comments: updatedComments
                });
                updatedInCloud = true;
              } catch (wsErr) {
                console.warn("Workspace comment update, trying user path:", wsErr);
              }
            }
          }
          if (!updatedInCloud && user?.uid) {
            try {
              await updateDoc(doc(db, 'users', user.uid, 'tasks', taskToEdit.id), {
                comments: updatedComments
              });
              updatedInCloud = true;
            } catch (uErr) {
              console.warn("User comment update error:", uErr);
            }
          }
          if (updatedInCloud) {
            showToast("Comment posted to team!", "success");
          } else {
            showToast("Failed to sync comment.", "error");
          }
        } catch {
          showToast("Failed to sync comment.", "error");
        }
      }

      onNotifyTeammate?.({
        type: 'comment',
        taskId: taskToEdit.id,
        workspaceId: taskToEdit.workspaceId || activeWorkspaceId,
        title: task.title,
        message: `${user?.displayName || 'Teammate'} commented: "${commentObj.text}"`,
        project: task.project,
        priority: task.priority,
        assignee: task.assignee,
        author: user?.displayName || 'User',
        authorUid: user?.uid
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title.trim() || isSubmitting) return;

    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid && !user?.isGuest) {
      showToast("User session not found. Please sign in again.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanTask = { ...task };
      delete cleanTask.id;
      // Strip undefined values completely
      const finalPayload = {};
      Object.entries(cleanTask).forEach(([k, v]) => {
        if (v !== undefined) finalPayload[k] = v;
      });

      if (user?.isGuest) {
        const saved = JSON.parse(localStorage.getItem('tb_guest_tasks') || '[]');
        let updated;
        const targetId = taskToEdit?.id || 'guest_' + Date.now();
        if (taskToEdit && taskToEdit.id) {
          updated = saved.map(t => t.id === taskToEdit.id ? { ...t, ...finalPayload } : t);
          showToast("Task updated.", "success");
        } else {
          updated = [{ ...finalPayload, id: targetId, createdAt: new Date().toISOString() }, ...saved];
          showToast("New task created.", "success");
        }
        localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
        window.dispatchEvent(new Event('tb_guest_tasks_updated'));

        if (finalPayload.assignee && finalPayload.assignee !== 'Me' && finalPayload.assignee !== user?.displayName) {
          try {
            onNotifyTeammate?.({ ...finalPayload, id: targetId, author: user?.displayName, authorUid: user?.uid }, !taskToEdit?.id);
          } catch (notifErr) {
            console.warn("Notification dispatch error:", notifErr);
          }
        }

        onClose();
        return;
      }

      let savedTaskId = taskToEdit?.id;
      const isAssignedToTeammate = finalPayload.assignee && finalPayload.assignee !== 'Me' && finalPayload.assignee !== user?.displayName;
      const targetWsId = taskToEdit?.workspaceId || (activeWorkspaceId && activeWorkspaceId !== 'local_workspace' ? activeWorkspaceId : null);

      // Check if project belongs to a team project
      const targetTeamProj = allProjects?.find(p =>
        p.type === 'team' && (
          (finalPayload.projectId && p.id === finalPayload.projectId) ||
          (taskToEdit?.projectId && p.id === taskToEdit.projectId) ||
          (typeof finalPayload.project === 'string' && typeof p.name === 'string' && finalPayload.project.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
          (typeof taskToEdit?.project === 'string' && typeof p.name === 'string' && taskToEdit.project.trim().toLowerCase() === p.name.trim().toLowerCase())
        )
      ) || (currentWorkspace === 'team' ? allProjects?.find(p => p.type === 'team') : null);

      const isTeam = currentWorkspace === 'team' || taskToEdit?.isWorkspaceTask || !!targetTeamProj;

      const payloadToSave = {
        ...finalPayload,
        ...(targetTeamProj ? {
          projectId: targetTeamProj.id,
          project: targetTeamProj.name
        } : {}),
        workspaceType: isTeam ? 'team' : 'personal',
        isWorkspaceTask: isTeam,
        updatedAt: new Date().toISOString()
      };

      if (taskToEdit && taskToEdit.id) {
        if (targetTeamProj) {
          await setDoc(doc(db, 'projects', targetTeamProj.id, 'tasks', taskToEdit.id), {
            ...taskToEdit,
            ...payloadToSave,
            projectId: targetTeamProj.id,
            project: targetTeamProj.name,
            workspaceType: 'team',
            isWorkspaceTask: true
          }, { merge: true });
          // Purge from personal collection if it was previously saved there
          try { await deleteDoc(doc(db, 'users', currentUid, 'tasks', taskToEdit.id)); } catch { /* ignore */ }
          if (targetWsId) {
            try { await deleteDoc(doc(db, 'workspaces', targetWsId, 'tasks', taskToEdit.id)); } catch { /* ignore */ }
          }
        } else if (isTeam && targetWsId) {
          await setDoc(doc(db, 'workspaces', targetWsId, 'tasks', taskToEdit.id), {
            ...taskToEdit,
            ...payloadToSave,
            workspaceId: targetWsId
          }, { merge: true });
          if (!taskToEdit.isWorkspaceTask) {
            try { await deleteDoc(doc(db, 'users', currentUid, 'tasks', taskToEdit.id)); } catch { /* ignore */ }
          }
        } else {
          await updateDoc(doc(db, 'users', currentUid, 'tasks', taskToEdit.id), payloadToSave);
        }
        if (isTeam) {
          try {
            onNotifyTaskEdit?.(taskToEdit, payloadToSave);
          } catch (notifErr) {
            console.warn("Edit notification dispatch error:", notifErr);
          }
        }
        showToast("Task updated.", "success");
      } else {
        if (targetTeamProj) {
          const docRef = await addDoc(collection(db, 'projects', targetTeamProj.id, 'tasks'), {
            ...payloadToSave,
            projectId: targetTeamProj.id,
            project: targetTeamProj.name,
            workspaceType: 'team',
            isWorkspaceTask: true,
            creatorUid: currentUid,
            creatorName: user?.displayName || 'Teammate',
            createdAt: new Date().toISOString()
          });
          savedTaskId = docRef.id;
        } else if (isTeam && targetWsId) {
          const docRef = await addDoc(collection(db, 'workspaces', targetWsId, 'tasks'), {
            ...payloadToSave,
            workspaceId: targetWsId,
            creatorUid: currentUid,
            creatorName: user?.displayName || 'Teammate',
            createdAt: new Date().toISOString()
          });
          savedTaskId = docRef.id;
        } else {
          const docRef = await addDoc(collection(db, 'users', currentUid, 'tasks'), {
            ...payloadToSave,
            creatorUid: currentUid,
            createdAt: new Date().toISOString()
          });
          savedTaskId = docRef.id;
        }
        showToast("New task created.", "success");
      }

      if (isTeam && isAssignedToTeammate) {
        try {
          onNotifyTeammate?.({
            type: 'task_assigned',
            id: savedTaskId,
            taskId: savedTaskId,
            title: finalPayload.title,
            message: `${user?.displayName || 'Teammate'} assigned you "${finalPayload.title}"`,
            project: finalPayload.project,
            priority: finalPayload.priority,
            assignee: finalPayload.assignee,
            workspaceId: targetWsId,
            author: user?.displayName || 'Teammate',
            authorUid: currentUid
          });
        } catch (notifErr) {
          console.warn("Notification dispatch error:", notifErr);
        }
      }

      onClose();
    } catch (err) {
      console.error("Save task error:", err);
      showToast(err?.message || "Failed to save task.", "error");
      setIsSubmitting(false);
    }
  };

  // Compute team member pills (strictly genuine workspace members, scoped per project privacy)
  const availableMembers = useMemo(() => {
    const myName = (user?.displayName || '').trim();
    if (currentWorkspace === 'personal') {
      return [myName || 'Me'];
    }
    // In Team workspace:
    // Check if the selected project has explicit members
    const selectedProj = allProjects.find(p => p.name?.toLowerCase() === task.project?.toLowerCase());
    if (selectedProj && Array.isArray(selectedProj.members) && selectedProj.members.length > 0) {
      const names = selectedProj.members.map(m => m.displayName || m.name || m.email).filter(Boolean);
      return Array.from(new Set([myName || 'Me', ...names]));
    }
    // Fallback: Owner + connected teammates
    const connNames = (connections || []).map(c => c.displayName || c.name || c.email).filter(Boolean);
    const combined = [myName || 'Me', ...connNames];
    return Array.from(new Set(combined));
  }, [currentWorkspace, task.project, allProjects, connections, user]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4 z-[200] animate-in fade-in">
      <div className="bg-white dark:bg-[#0d121f] rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200/90 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/70 dark:bg-[#101726]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {taskToEdit?.id ? 'Task Details & Activity' : 'Create New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#151e32] rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <form id="taskForm" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 md:border-r border-slate-100 dark:border-white/[0.06] hide-scrollbar">

            <div className={`grid gap-4 mb-2 ${currentWorkspace === 'personal' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  <Folder size={14} className="text-indigo-500" /> Project
                </label>
                {prefilledProject ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-sm font-bold shadow-xs">
                    <Folder size={15} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{task.project}</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-1 shrink-0">
                      <Lock size={10} /> Locked to Project
                    </span>
                  </div>
                ) : (
                  <CustomDropdown
                    options={workspaceProjectChoices}
                    value={task.project}
                    onChange={(p) => setTask(prev => ({ ...prev, project: p }))}
                  />
                )}
              </div>

              {currentWorkspace === 'team' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    <UserPlus size={14} className="text-indigo-500" /> Assignee
                  </label>
                  <CustomDropdown
                    options={availableMembers}
                    value={task.assignee || 'Me'}
                    onChange={(m) => setTask(prev => ({ ...prev, assignee: m }))}
                  />
                  {user?.isGuest ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                      <Lock size={10} /> Local mode: Sign in to assign tasks & notify teammates
                    </p>
                  ) : task.assignee && task.assignee !== 'Me' && task.assignee !== user?.displayName ? (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-1">
                      <Bell size={10} /> Instant notification will be sent to {task.assignee}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Task Title</label>
                <button
                  type="button"
                  onClick={handleVoiceRamble}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isRecordingVoice
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/40'
                  }`}
                  title="Dictate task title & notes with AI Voice Ramble"
                >
                  <Mic size={13} className={isRecordingVoice ? 'animate-bounce text-white' : ''} />
                  <span>{isRecordingVoice ? 'Listening (Click to Stop)' : 'Voice Ramble'}</span>
                  {isApex && <span className="text-[9px] font-black uppercase text-amber-500">✦</span>}
                </button>
              </div>

              {/* Live Voice Preview Bar */}
              {isRecordingVoice && (
                <div className="mb-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="font-bold shrink-0">Listening:</span>
                  <span className="italic truncate text-slate-800 dark:text-slate-200">
                    {liveTranscript ? `"${liveTranscript}"` : 'Speak naturally (e.g. "Cs assignment due tomorrow high priority")...'}
                  </span>
                </div>
              )}

              <input
                type="text"
                required
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none font-medium focus:ring-2 focus:ring-blue-500/40"
                placeholder="What needs to be done?"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
              />
            </div>

            {/* Subtasks / Steps Checklist */}
            <div className="space-y-2.5 bg-slate-50/80 dark:bg-[#121929]/80 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-indigo-500" /> Steps
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {(task.steps || []).filter(s => s.completed).length} of {(task.steps || []).length} completed
                    {!isApex && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black ${
                        isStepLimitReached
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isStepLimitReached ? '🔒 ' : ''}{(task.steps || []).length}/{maxSteps}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleAIBreakdown}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    title="Generate intelligent subtasks from task title"
                  >
                    <Sparkles size={12} /> AI Breakdown
                  </button>
                </div>
              </div>

              {/* Steps Progress Bar */}
              {(task.steps || []).length > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((task.steps || []).filter(s => s.completed).length / (task.steps || []).length) * 100}%` }}
                  />
                </div>
              )}

              {/* Steps List */}
              {(task.steps || []).length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                  {(task.steps || []).map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white dark:bg-[#0c121e] border border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStep(step.id)}
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            step.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-400 dark:border-slate-600 hover:border-emerald-500'
                          }`}
                        >
                          {step.completed && <Check size={10} className="stroke-[3]" />}
                        </button>
                        <span
                          className={`text-xs font-semibold truncate ${
                            step.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                        title="Delete step"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Step Input or Core Limit Notice */}
              {isStepLimitReached ? (
                <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
                    <Lock size={14} className="shrink-0 text-amber-500" />
                    <span className="truncate">
                      Core tier allows up to <strong>{maxSteps} subtasks</strong> per task. Upgrade to Apex for unlimited subtasks.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenApexModal?.()}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] hover:opacity-90 transition-opacity shrink-0 shadow-sm"
                  >
                    Upgrade ✦
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Plus size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={handleAddStep}
                    placeholder={!isApex ? `Next step... (${maxSteps - currentStepsCount} remaining on Core)` : "Next step... (press Enter ↵)"}
                    className="flex-1 bg-transparent text-xs font-medium outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddStep()}
                    disabled={!newStepText.trim()}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold disabled:opacity-30 hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    Add Step
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                <AlignLeft size={16} /> Description & Notes
              </label>
              <textarea
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none min-h-[90px] text-sm focus:ring-2 focus:ring-blue-500/40"
                placeholder="Add more details, links, or context for this task..."
                value={task.description}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-40">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <AlertCircle size={16} /> Priority
                </label>
                <CustomDropdown
                  options={['Low', 'Medium', 'High', 'Urgent']}
                  value={task.priority}
                  onChange={(val) => setTask({ ...task, priority: val })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Status</label>
                <CustomDropdown
                  options={['To Do', 'In Progress', 'Review', 'Completed']}
                  value={task.status}
                  onChange={(val) => setTask({ ...task, status: val })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-30">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Tag size={16} /> Tags/Category
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Work, Urgent"
                  value={task.category}
                  onChange={(e) => setTask({ ...task, category: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Calendar size={16} /> Deadline
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.deadline}
                  onChange={(e) => setTask({ ...task, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-20">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Clock size={16} /> Start Time
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.startTime || ''}
                  onChange={(e) => setTask({ ...task, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Clock size={16} /> End Time
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.endTime || ''}
                  onChange={(e) => setTask({ ...task, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-10 border-t border-gray-100 dark:border-slate-800 pt-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Repeat size={16} /> Recurrence
                </label>
                <CustomDropdown
                  options={['None', 'Daily', 'Weekly', 'Monthly']}
                  value={task.recurrence || 'None'}
                  onChange={(val) => setTask({ ...task, recurrence: val })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Paperclip size={16} /> Local File
                </label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl py-2.5 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                >
                  {task.attachmentName
                    ? (task.attachmentName.length > 15 ? task.attachmentName.substring(0, 15) + '...' : task.attachmentName)
                    : (isApex ? 'Upload (Max 100MB)' : 'Upload (Max 5MB)')}
                </button>
              </div>
            </div>

            {/* Apex Duration / Time-Blocking */}
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                  <Clock size={14} className="text-indigo-500" /> Duration (Time-Blocking)
                </label>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950">
                  ✦ APEX
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[15, 30, 45, 60, 90, 120].map(mins => {
                  const isSelected = (task.durationMinutes || 45) === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        if (!isApex) {
                          showToast?.("✦ Custom Task Durations are an Apex feature. Standard default is 45m.", "info");
                          return;
                        }
                        setTask(prev => ({ ...prev, durationMinutes: mins }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apex Intelligent Reminders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-800 pt-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                    <Bell size={14} className="text-amber-500" /> Multiple Reminders
                  </label>
                  <span className="text-[9px] font-black uppercase text-amber-500">✦ APEX</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['At due time', '15m before', '1 hour before', '1 day before'].map(rem => {
                    const active = (task.reminders || []).includes(rem);
                    return (
                      <button
                        key={rem}
                        type="button"
                        onClick={() => {
                          if (!isApex && rem !== 'At due time') {
                            showToast?.("✦ Stacking multiple reminders is exclusive to Apex accounts.", "info");
                            return;
                          }
                          setTask(prev => {
                            const cur = prev.reminders || ['At due time'];
                            const next = cur.includes(rem) ? cur.filter(r => r !== rem) : [...cur, rem];
                            return { ...prev, reminders: next.length > 0 ? next : ['At due time'] };
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {rem}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                    <MapPin size={14} className="text-rose-500" /> Location Reminder
                  </label>
                  <span className="text-[9px] font-black uppercase text-amber-500">✦ APEX</span>
                </div>
                <select
                  value={task.locationReminder || ''}
                  onChange={(e) => {
                    if (!isApex && e.target.value) {
                      onOpenApexModal?.();
                      showToast?.("✦ Geofence location alerts are exclusive to Apex.", "info");
                      return;
                    }
                    setTask(prev => ({ ...prev, locationReminder: e.target.value }));
                  }}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-white outline-none"
                >
                  <option value="">No Location Alert</option>
                  <option value="Office">📍 Arrive at Office</option>
                  <option value="Home">📍 Return Home</option>
                  <option value="Client Site">📍 Client / Field Site</option>
                  <option value="Custom">📍 Custom Location Pin</option>
                </select>

                {task.locationReminder && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter address, building, or place name..."
                        value={task.locationAddress || ''}
                        onChange={(e) => setTask(prev => ({ ...prev, locationAddress: e.target.value }))}
                        className="flex-1 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/40 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        title="Use Current GPS Coordinates"
                        className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                      >
                        <Navigation size={12} />
                        <span>GPS</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-slate-400 font-medium">Trigger:</span>
                        <button
                          type="button"
                          onClick={() => setTask(prev => ({ ...prev, locationTrigger: 'arrive' }))}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            (!task.locationTrigger || task.locationTrigger === 'arrive')
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          On Arrive (200m)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTask(prev => ({ ...prev, locationTrigger: 'leave' }))}
                          className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                            task.locationTrigger === 'leave'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          On Leave
                        </button>
                      </div>

                      {(task.locationAddress || task.locationCoords) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            task.locationAddress || (task.locationCoords ? `${task.locationCoords.lat},${task.locationCoords.lng}` : '')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <ExternalLink size={11} />
                          <span>View Map</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                <LinkIcon size={16} /> Or Cloud Link (G-Drive, Docs)
              </label>
              <input
                type="url"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="https://..."
                value={task.attachmentLink || ''}
                onChange={(e) => setTask({ ...task, attachmentLink: e.target.value })}
              />
            </div>
          </form>

          {/* Notes & Activity Section */}
          <div className="w-full md:w-1/3 bg-slate-50/70 dark:bg-[#101726]/60 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/[0.06]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                  {currentWorkspace === 'personal' ? 'Personal Notes & Activity' : 'Team Discussion'}
                </h3>
                {taskToEdit?.id && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    Live
                  </span>
                )}
              </div>

              {currentWorkspace === 'team' && availableMembers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="text-[10px] font-bold text-slate-400">Tag:</span>
                  {availableMembers.map(m => {
                    const isMe = m.toLowerCase() === (user?.displayName || '').toLowerCase() || m.toLowerCase() === 'me';
                    const tagName = isMe ? (user?.displayName ? user.displayName.split(' ')[0] : 'Me') : m.split(' ')[0];
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewComment(prev => `${prev}@${tagName} `)}
                        className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors font-bold"
                      >
                        @{tagName}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="overflow-y-auto space-y-3 pr-1 max-h-[350px] hide-scrollbar">
                {(task.comments || []).length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                      <MessageSquare size={18} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-semibold">
                      {currentWorkspace === 'personal' ? 'No personal notes yet.' : 'No team notes or activity yet.'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                      {currentWorkspace === 'personal' ? 'Add thoughts, reflections, or activity logs below.' : 'Post updates or tag teammates below.'}
                    </p>
                  </div>
                ) : (
                  (task.comments || []).map((c, i) => (
                    <div key={i} className="bg-white dark:bg-[#151e32] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-xs animate-in fade-in">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white text-[8px] flex items-center justify-center font-black">
                            {(c.author || 'U').charAt(0).toUpperCase()}
                          </span>
                          {c.author}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">{c.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 dark:border-white/[0.06] mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={currentWorkspace === 'personal' ? 'Add personal note...' : 'Post update or tag team...'}
                  className="flex-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="bg-indigo-600 text-white p-2.5 rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm active:scale-95 shrink-0"
                  title={currentWorkspace === 'personal' ? 'Save Note' : 'Send Comment'}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#101726]/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#151e32] rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="taskForm"
            disabled={isSubmitting || !task.title.trim()}
            className="px-6 py-2.5 text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            {isSubmitting ? 'Processing...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
