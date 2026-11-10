package com.taskbandhu.apex

import android.accounts.Account
import android.accounts.AccountManager
import android.app.Activity
import android.content.Intent
import android.content.res.AssetFileDescriptor
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.SoundEffectConstants
import android.view.WindowManager
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val TAG = "TaskBandhuAudio"
    private val CHANNEL = "com.taskbandhu.apex/audio"
    private var mediaPlayer: MediaPlayer? = null
    private var currentAfd: AssetFileDescriptor? = null
    private var currentUrl: String? = null
    private var toneGenerator: ToneGenerator? = null
    private var currentRingtone: Ringtone? = null
    private var vibrator: Vibrator? = null
    private var outgoingRingtoneGenerator: ToneGenerator? = null
    private var outgoingRingTimer: java.util.Timer? = null
    private val RC_CHOOSE_ACCOUNT = 10091
    private var pendingAuthResult: MethodChannel.Result? = null

    private fun releaseMediaPlayer() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.reset()
            mediaPlayer?.release()
        } catch (e: Exception) {
            Log.w(TAG, "mediaPlayer release error: ${e.message}")
        }
        mediaPlayer = null
        try {
            currentAfd?.close()
        } catch (e: Exception) {
            Log.w(TAG, "currentAfd close error: ${e.message}")
        }
        currentAfd = null
        currentUrl = null
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_CHOOSE_ACCOUNT) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val accountName = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME)
                if (!accountName.isNullOrBlank()) {
                    val rawName = accountName.substringBefore("@").replace(".", " ")
                    val displayName = rawName.split(" ").filter { it.isNotBlank() }
                        .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                    pendingAuthResult?.success(mapOf(
                        "success" to true,
                        "email" to accountName,
                        "name" to displayName
                    ))
                } else {
                    pendingAuthResult?.success(mapOf(
                        "success" to false,
                        "cancelled" to true
                    ))
                }
            } else {
                pendingAuthResult?.success(mapOf(
                    "success" to false,
                    "cancelled" to true
                ))
            }
            pendingAuthResult = null
        }
    }

    private fun getToneGen(): ToneGenerator {
        if (toneGenerator == null) {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90)
        }
        return toneGenerator!!
    }

    private fun getVibrator(): Vibrator? {
        if (vibrator == null) {
            vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                val vm = getSystemService(android.content.Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(android.content.Context.VIBRATOR_SERVICE) as? Vibrator
            }
        }
        return vibrator
    }

    private fun stopRingingInternal() {
        try {
            currentRingtone?.stop()
            currentRingtone = null
            outgoingRingTimer?.cancel()
            outgoingRingTimer = null
            outgoingRingtoneGenerator?.stopTone()
            outgoingRingtoneGenerator?.release()
            outgoingRingtoneGenerator = null
            getVibrator()?.cancel()
        } catch (e: Exception) {
            Log.w(TAG, "stopRinging error: ${e.message}")
        }
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "play" -> {
                    val url = call.argument<String>("url")
                    if (url != null) {
                        try {
                            if (mediaPlayer != null && currentUrl == url) {
                                try {
                                    if (!mediaPlayer!!.isPlaying) {
                                        mediaPlayer!!.start()
                                    }
                                    result.success(true)
                                    return@setMethodCallHandler
                                } catch (e: Exception) {
                                    Log.w(TAG, "Failed to resume existing player, reinitializing: ${e.message}")
                                }
                            }
                            releaseMediaPlayer()
                            mediaPlayer = MediaPlayer().apply {
                                setAudioAttributes(
                                    AudioAttributes.Builder()
                                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                        .setUsage(AudioAttributes.USAGE_MEDIA)
                                        .build()
                                )
                                setWakeMode(applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
                                if (url.startsWith("asset:///")) {
                                    val assetPath = url.removePrefix("asset:///")
                                    currentAfd = try {
                                        applicationContext.assets.openFd("flutter_assets/$assetPath")
                                    } catch (e: Exception) {
                                        applicationContext.assets.openFd(assetPath)
                                    }
                                    val afd = currentAfd!!
                                    setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                                } else {
                                    setDataSource(applicationContext, Uri.parse(url))
                                }
                                isLooping = true
                                setVolume(0.85f, 0.85f)
                                setOnErrorListener { mp, what, extra ->
                                    Log.e(TAG, "MediaPlayer error: what=$what extra=$extra")
                                    releaseMediaPlayer()
                                    true
                                }
                                setOnPreparedListener { mp ->
                                    Log.i(TAG, "MediaPlayer prepared, starting continuous looping playback for: $url")
                                    mp.isLooping = true
                                    mp.start()
                                }
                                prepareAsync()
                            }
                            currentUrl = url
                            result.success(true)
                        } catch (e: Exception) {
                            Log.e(TAG, "Play error: ${e.message}", e)
                            releaseMediaPlayer()
                            result.error("AUDIO_ERROR", e.message, null)
                        }
                    } else {
                        result.error("INVALID_URL", "URL cannot be null", null)
                    }
                }
                "pause" -> {
                    try {
                        if (mediaPlayer?.isPlaying == true) {
                            mediaPlayer?.pause()
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("PAUSE_ERROR", e.message, null)
                    }
                }
                "resume" -> {
                    try {
                        mediaPlayer?.start()
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("RESUME_ERROR", e.message, null)
                    }
                }
                "stop" -> {
                    releaseMediaPlayer()
                    result.success(true)
                }
                "setVolume" -> {
                    val vol = call.argument<Double>("volume")?.toFloat() ?: 0.85f
                    mediaPlayer?.setVolume(vol, vol)
                    result.success(true)
                }
                "seek" -> {
                    val position = call.argument<Int>("position") ?: 0
                    try {
                        mediaPlayer?.seekTo(position * 1000)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SEEK_ERROR", e.message, null)
                    }
                }
                "playSoundEffect" -> {
                    val effect = call.argument<String>("effect") ?: "click"
                    try {
                        when (effect) {
                            "task_done" -> {
                                try {
                                    val afd = applicationContext.assets.openFd("flutter_assets/assets/audio/task_done.wav")
                                    val sfx = MediaPlayer()
                                    sfx.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                                    afd.close()
                                    sfx.setOnCompletionListener { it.release() }
                                    sfx.prepare()
                                    sfx.start()
                                } catch (e: Exception) {
                                    getToneGen().startTone(ToneGenerator.TONE_PROP_ACK, 250)
                                }
                            }
                            "focus_bell", "focus_start", "focus_complete" -> {
                                try {
                                    val afd = applicationContext.assets.openFd("flutter_assets/assets/audio/focus_bell.wav")
                                    val sfx = MediaPlayer()
                                    sfx.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                                    afd.close()
                                    sfx.setOnCompletionListener { it.release() }
                                    sfx.prepare()
                                    sfx.start()
                                } catch (e: Exception) {
                                    getToneGen().startTone(ToneGenerator.TONE_PROP_PROMPT, 350)
                                }
                            }
                            "notification" -> {
                                try {
                                    val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                                    RingtoneManager.getRingtone(applicationContext, uri)?.play()
                                } catch (e: Exception) {
                                    getToneGen().startTone(ToneGenerator.TONE_PROP_BEEP, 200)
                                }
                            }
                            else -> {
                                window.decorView.playSoundEffect(SoundEffectConstants.CLICK)
                            }
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.success(false)
                    }
                }
                "startRinging" -> {
                    val mode = call.argument<String>("mode") ?: "incoming"
                    try {
                        stopRingingInternal()
                        if (mode == "incoming") {
                            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                            currentRingtone = RingtoneManager.getRingtone(applicationContext, ringtoneUri)
                            currentRingtone?.let { r ->
                                r.audioAttributes = AudioAttributes.Builder()
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                                    .build()
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                                    r.isLooping = true
                                }
                                r.play()
                            }
                            val vib = getVibrator()
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                vib?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 1000, 1000), 0))
                            } else {
                                @Suppress("DEPRECATION")
                                vib?.vibrate(longArrayOf(0, 1000, 1000), 0)
                            }
                        } else {
                            outgoingRingtoneGenerator = ToneGenerator(AudioManager.STREAM_VOICE_CALL, 85)
                            outgoingRingTimer = java.util.Timer()
                            outgoingRingTimer?.scheduleAtFixedRate(object : java.util.TimerTask() {
                                override fun run() {
                                    try {
                                        outgoingRingtoneGenerator?.startTone(ToneGenerator.TONE_SUP_RINGTONE, 1400)
                                    } catch (e: Exception) {
                                        cancel()
                                    }
                                }
                            }, 0, 3500)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        Log.e(TAG, "startRinging error: ${e.message}")
                        result.success(false)
                    }
                }
                "stopRinging" -> {
                    stopRingingInternal()
                    result.success(true)
                }
                "setSpeakerphone" -> {
                    val enabled = call.argument<Boolean>("enabled") ?: true
                    try {
                        val audioManager = getSystemService(android.content.Context.AUDIO_SERVICE) as? AudioManager
                        audioManager?.mode = AudioManager.MODE_IN_COMMUNICATION
                        audioManager?.isSpeakerphoneOn = enabled
                        result.success(true)
                    } catch (e: Exception) {
                        result.success(false)
                    }
                }
                "setAppIcon" -> {
                    val iconName = call.argument<String>("icon") ?: "default"
                    val pkg = packageName
                    val aliases = mapOf(
                        "default" to "$pkg.MainActivityDefault",
                        "dark" to "$pkg.MainActivityDark",
                        "light" to "$pkg.MainActivityLight",
                        "gold" to "$pkg.MainActivityGold",
                        "cyber" to "$pkg.MainActivityCyber",
                        "retro" to "$pkg.MainActivityRetro",
                        "flame" to "$pkg.MainActivityFlame",
                        "cosmic" to "$pkg.MainActivityCosmic",
                        "mercury" to "$pkg.MainActivityMercury",
                        "premium_1" to "$pkg.MainActivityGold",
                        "premium_2" to "$pkg.MainActivityCyber",
                        "premium_3" to "$pkg.MainActivityRetro",
                        "premium_4" to "$pkg.MainActivityFlame",
                        "premium_5" to "$pkg.MainActivityCosmic",
                        "premium_6" to "$pkg.MainActivityMercury",
                        "neon_tube" to "$pkg.MainActivityNeonTube",
                        "tg_sunset" to "$pkg.MainActivityTgSunset",
                        "tg_cyan" to "$pkg.MainActivityTgCyan",
                        "wa_emerald" to "$pkg.MainActivityWaEmerald",
                        "wa_mono" to "$pkg.MainActivityWaMono",
                        "diwali" to "$pkg.MainActivityDiwali",
                        "holi" to "$pkg.MainActivityHoli",
                        "newyear" to "$pkg.MainActivityNewYear",
                        "christmas" to "$pkg.MainActivityChristmas"
                    )

                    try {
                        val targetComponent = aliases[iconName] ?: "$pkg.MainActivityDefault"
                        for ((name, comp) in aliases) {
                            val state = if (comp == targetComponent) {
                                android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                            } else {
                                android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED
                            }
                            packageManager.setComponentEnabledSetting(
                                android.content.ComponentName(pkg, comp),
                                state,
                                android.content.pm.PackageManager.DONT_KILL_APP
                            )
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        Log.e(TAG, "setAppIcon error: ${e.message}", e)
                        result.error("APP_ICON_ERROR", e.message, null)
                    }
                }
                "getCurrentAppIcon" -> {
                    val pkg = packageName
                    val aliases = listOf(
                        "diwali" to "$pkg.MainActivityDiwali",
                        "holi" to "$pkg.MainActivityHoli",
                        "newyear" to "$pkg.MainActivityNewYear",
                        "christmas" to "$pkg.MainActivityChristmas",
                        "retro" to "$pkg.MainActivityRetro",
                        "flame" to "$pkg.MainActivityFlame",
                        "cosmic" to "$pkg.MainActivityCosmic",
                        "mercury" to "$pkg.MainActivityMercury",
                        "neon_tube" to "$pkg.MainActivityNeonTube",
                        "tg_sunset" to "$pkg.MainActivityTgSunset",
                        "tg_cyan" to "$pkg.MainActivityTgCyan",
                        "wa_emerald" to "$pkg.MainActivityWaEmerald",
                        "wa_mono" to "$pkg.MainActivityWaMono",
                        "cyber" to "$pkg.MainActivityCyber",
                        "gold" to "$pkg.MainActivityGold",
                        "light" to "$pkg.MainActivityLight",
                        "dark" to "$pkg.MainActivityDark",
                        "default" to "$pkg.MainActivityDefault"
                    )
                    var active = "default"
                    for ((name, comp) in aliases) {
                        val state = packageManager.getComponentEnabledSetting(android.content.ComponentName(pkg, comp))
                        if (state == android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                            active = name
                            break
                        }
                    }
                    result.success(active)
                }
                "pickGoogleAccount" -> {
                    pendingAuthResult = result
                    try {
                        val intent = AccountManager.newChooseAccountIntent(
                            null,
                            null,
                            arrayOf("com.google"),
                            null,
                            null,
                            null,
                            null
                        )
                        startActivityForResult(intent, RC_CHOOSE_ACCOUNT)
                    } catch (e: Exception) {
                        Log.w(TAG, "newChooseAccountIntent error: ${e.message}")
                        result.success(mapOf("success" to false, "error" to (e.message ?: "Account picker unavailable")))
                        pendingAuthResult = null
                    }
                }
                "getDeviceGoogleAccounts" -> {
                    try {
                        val manager = AccountManager.get(this)
                        val accounts = manager.getAccountsByType("com.google")
                        val accountList = accounts.map {
                            val email = it.name
                            val rawName = email.substringBefore("@").replace(".", " ")
                            val displayName = rawName.split(" ").filter { s -> s.isNotBlank() }
                                .joinToString(" ") { s -> s.replaceFirstChar { c -> c.uppercase() } }
                            mapOf(
                                "email" to email,
                                "name" to displayName
                            )
                        }
                        result.success(accountList)
                    } catch (e: Exception) {
                        Log.w(TAG, "getDeviceGoogleAccounts error: ${e.message}")
                        result.success(emptyList<Map<String, String>>())
                    }
                }
                "keepScreenOn" -> {
                    val enable = call.argument<Boolean>("enable") ?: true
                    runOnUiThread {
                        if (enable) {
                            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        }
                    }
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onDestroy() {
        stopRingingInternal()
        releaseMediaPlayer()
        toneGenerator?.release()
        toneGenerator = null
        super.onDestroy()
    }
}
