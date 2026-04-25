const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin for SMS Listener with Native BroadcastReceiver
 * This plugin:
 * 1. Adds SMS permissions to AndroidManifest.xml
 * 2. Registers SMSBroadcastReceiver for SMS_RECEIVED
 * 3. Injects Kotlin files into android/app/src/main/java during prebuild
 */

const KOTLIN_FILES = {
  'SMSBroadcastReceiver.kt': `package com.jman.finesseeas

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build
import java.util.regex.Pattern

class SMSBroadcastReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "SMSBroadcastReceiver"
        private const val CHANNEL_ID = "transaction_alerts"
        private const val CHANNEL_NAME = "Transaction Alerts"
        
        // Robust regex patterns for Indian bank SMS
        private val AMOUNT_PATTERN = Pattern.compile(
            "(?:Rs\\\\.?|INR|₹)\\\\s*([\\\\d,]+\\\\.?\\\\d*)",
            Pattern.CASE_INSENSITIVE
        )
        
        private val DEBIT_PATTERN = Pattern.compile(
            "(?:debited|paid|paid thru|thru|debit|spent|withdrawn|purchase|transferred)",
            Pattern.CASE_INSENSITIVE
        )
        
        private val CREDIT_PATTERN = Pattern.compile(
            "(?:credited|credit|received|deposited)",
            Pattern.CASE_INSENSITIVE
        )
        
        private val MERCHANT_PATTERN = Pattern.compile(
            "(?:to|at|from)\\s+([A-Za-z\\s&.-]+?)(?=\\s*(?:Rs\\.?|INR|₹|\\d|,|\\s*,|\\s*UPI|\\s*on|\\s*\\.|A/C|account|$))",
            Pattern.CASE_INSENSITIVE
        )
        
        private val ACCOUNT_PATTERN = Pattern.compile(
            "(?:A/C|account|a/c)[\\\\s:]*(?:XX)?(\\\\d{4})",
            Pattern.CASE_INSENSITIVE
        )
        
        // Known bank keywords for filtering
        private val BANK_KEYWORDS = listOf(
            "debited", "credited", "debit", "credit", "spent", "withdrawn",
            "purchase", "deposited", "received", "INR", "Rs.", "₹",
            "account", "A/C", "balance", "avail", "UPI"
        )
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            return
        }
        
        Log.d(TAG, "SMS Received - Processing...")
        
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isEmpty()) {
            Log.d(TAG, "No messages found in intent")
            return
        }
        
        for (smsMessage in messages) {
            val messageBody = smsMessage.messageBody ?: continue
            val sender = smsMessage.originatingAddress ?: "Unknown"
            
            Log.d(TAG, "SMS from: $sender")
            Log.d(TAG, "Body: \${messageBody.take(100)}...")
            
            if (isBankSMS(messageBody)) {
                Log.d(TAG, "✅ Bank SMS detected")
                val transaction = parseTransaction(messageBody, sender)
                if (transaction != null) {
                    Log.d(TAG, "✅ Transaction parsed: \${transaction.amount} \${transaction.type}")
                    showNotification(context, transaction)
                } else {
                    Log.d(TAG, "❌ Failed to parse transaction")
                }
            } else {
                Log.d(TAG, "❌ Not a bank SMS")
            }
        }
    }
    
    private fun isBankSMS(body: String): Boolean {
        val upperBody = body.uppercase()
        
        // Check for transaction keywords
        val hasTransactionKeyword = DEBIT_PATTERN.matcher(body).find() || 
                                    CREDIT_PATTERN.matcher(body).find()
        
        // Check for amount
        val hasAmount = AMOUNT_PATTERN.matcher(body).find()
        
        // Check for bank-related keywords
        val hasBankKeyword = BANK_KEYWORDS.any { upperBody.contains(it.uppercase()) }
        
        return hasTransactionKeyword && hasAmount && hasBankKeyword
    }
    
    private fun parseTransaction(body: String, sender: String): Transaction? {
        // Parse amount
        val amountMatcher = AMOUNT_PATTERN.matcher(body)
        if (!amountMatcher.find()) return null
        
        val amountStr = amountMatcher.group(1)?.replace(",", "") ?: return null
        val amount = amountStr.toDoubleOrNull() ?: return null
        
        // Parse transaction type
        val type = when {
            DEBIT_PATTERN.matcher(body).find() -> "debit"
            CREDIT_PATTERN.matcher(body).find() -> "credit"
            else -> return null
        }
        
        // Parse merchant
        val merchantMatcher = MERCHANT_PATTERN.matcher(body)
        val merchant = if (merchantMatcher.find()) {
            merchantMatcher.group(1)?.trim()?.replace("\\\\s+".toRegex(), " ")
        } else null
        
        // Parse account number
        val accountMatcher = ACCOUNT_PATTERN.matcher(body)
        val accountNumber = if (accountMatcher.find()) {
            accountMatcher.group(1)
        } else null
        
        return Transaction(
            amount = amount,
            type = type,
            merchant = merchant,
            accountNumber = accountNumber,
            rawMessage = body,
            sender = sender,
            timestamp = System.currentTimeMillis()
        )
    }
    
    private fun showNotification(context: Context, transaction: Transaction) {
        createNotificationChannel(context)
        
        val notificationId = transaction.timestamp.toInt()
        
        // Create intent to open app with transaction data
        val categorizeIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "categorize")
            putExtra("amount", transaction.amount)
            putExtra("type", transaction.type)
            putExtra("merchant", transaction.merchant ?: "")
            putExtra("accountNumber", transaction.accountNumber ?: "")
            putExtra("rawMessage", transaction.rawMessage)
            putExtra("timestamp", transaction.timestamp)
            putExtra("notificationId", notificationId)
        }
        
        val categorizePendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            categorizeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Create ignore action
        val ignoreIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = "IGNORE_TRANSACTION"
            putExtra("notificationId", notificationId)
        }
        
        val ignorePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 1,
            ignoreIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Format notification content
        val emoji = if (transaction.type == "debit") "💸" else "💰"
        val typeText = if (transaction.type == "debit") "Spent" else "Received"
        val formattedAmount = String.format("₹%.2f", transaction.amount)
        
        val title = "$emoji $typeText $formattedAmount"
        var body = ""
        if (transaction.merchant != null) {
            body += "at \${transaction.merchant}"
        }
        if (transaction.accountNumber != null) {
            body += if (body.isNotEmpty()) " • " else ""
            body += "A/C XX\${transaction.accountNumber}"
        }
        if (body.isEmpty()) {
            body = "Transaction detected"
        }
        
        // Build notification
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(categorizePendingIntent)
            .addAction(
                android.R.drawable.ic_menu_edit,
                "Categorize",
                categorizePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Ignore",
                ignorePendingIntent
            )
            .build()
        
        // Show notification
        try {
            NotificationManagerCompat.from(context).notify(notificationId, notification)
            Log.d(TAG, "✅ Notification shown: ID=$notificationId")
        } catch (e: SecurityException) {
            Log.e(TAG, "❌ Failed to show notification: \${e.message}")
        }
    }
    
    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for bank transactions"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    data class Transaction(
        val amount: Double,
        val type: String,
        val merchant: String?,
        val accountNumber: String?,
        val rawMessage: String,
        val sender: String,
        val timestamp: Long
    )
}`,

  'NotificationActionReceiver.kt': `package com.jman.finesseeas

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import android.util.Log

class NotificationActionReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "NotificationActionReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "IGNORE_TRANSACTION" -> {
                val notificationId = intent.getIntExtra("notificationId", -1)
                if (notificationId != -1) {
                    NotificationManagerCompat.from(context).cancel(notificationId)
                    Log.d(TAG, "Transaction ignored: notificationId=$notificationId")
                }
            }
        }
    }
}`,

  'TransactionModule.kt': `package com.jman.finesseeas

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import android.util.Log

class TransactionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val TAG = "TransactionModule"
        private var pendingIntent: Intent? = null
    }
    
    override fun getName(): String {
        return "TransactionModule"
    }
    
    /**
     * Store the intent when activity is created/resumed
     */
    fun setIntent(intent: Intent?) {
        pendingIntent = intent
        Log.d(TAG, "Intent stored: \${intent?.extras?.keySet()?.joinToString()}")
    }
    
    /**
     * Get pending transaction data from the intent
     * Called from React Native when app comes to foreground
     */
    @ReactMethod
    fun getPendingTransaction(promise: Promise) {
        try {
            val intent = pendingIntent ?: currentActivity?.intent
            
            if (intent == null) {
                Log.d(TAG, "No intent available")
                promise.resolve(null)
                return
            }
            
            val action = intent.getStringExtra("action")
            
            if (action != "categorize") {
                Log.d(TAG, "No categorize action found")
                promise.resolve(null)
                return
            }
            
            val amount = intent.getDoubleExtra("amount", 0.0)
            val type = intent.getStringExtra("type")
            val merchant = intent.getStringExtra("merchant")
            val accountNumber = intent.getStringExtra("accountNumber")
            val rawMessage = intent.getStringExtra("rawMessage")
            val timestamp = intent.getLongExtra("timestamp", 0L)
            val notificationId = intent.getIntExtra("notificationId", -1)
            
            if (amount == 0.0 || type == null) {
                Log.d(TAG, "Invalid transaction data")
                promise.resolve(null)
                return
            }
            
            val result: WritableMap = Arguments.createMap().apply {
                putDouble("amount", amount)
                putString("type", type)
                putString("merchant", merchant ?: "")
                putString("accountNumber", accountNumber ?: "")
                putString("rawMessage", rawMessage ?: "")
                putDouble("timestamp", timestamp.toDouble())
                putInt("notificationId", notificationId)
            }
            
            Log.d(TAG, "✅ Returning transaction: amount=$amount, type=$type, merchant=$merchant")
            
            // Clear the intent extras to prevent duplicate processing
            intent.removeExtra("action")
            intent.removeExtra("amount")
            intent.removeExtra("type")
            intent.removeExtra("merchant")
            intent.removeExtra("accountNumber")
            intent.removeExtra("rawMessage")
            intent.removeExtra("timestamp")
            intent.removeExtra("notificationId")
            
            // Clear pending intent
            pendingIntent = null
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting pending transaction: \${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
    
    /**
     * Clear pending transaction
     */
    @ReactMethod
    fun clearPendingTransaction(promise: Promise) {
        try {
            pendingIntent = null
            currentActivity?.intent?.let { intent ->
                intent.removeExtra("action")
                intent.removeExtra("amount")
                intent.removeExtra("type")
                intent.removeExtra("merchant")
                intent.removeExtra("accountNumber")
                intent.removeExtra("rawMessage")
                intent.removeExtra("timestamp")
                intent.removeExtra("notificationId")
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}`,

  'TransactionPackage.kt': `package com.jman.finesseeas

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class TransactionPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(TransactionModule(reactContext))
    }
    
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}`,

  'MainApplication.kt': `// This file will be modified by the plugin to add TransactionPackage
// The plugin will inject the package registration into the existing MainApplication.kt`
};

function withSmsListener(config) {
  // Step 1: Add permissions to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Add permissions
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }
    
    const permissions = [
      'android.permission.RECEIVE_SMS',
      'android.permission.READ_SMS',
      'android.permission.POST_NOTIFICATIONS'
    ];
    
    permissions.forEach(permission => {
      if (!androidManifest['uses-permission'].find(p => p.$['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });
    
    // Add receivers to application
    const application = androidManifest.application[0];
    
    if (!application.receiver) {
      application.receiver = [];
    }
    
    // Add SMSBroadcastReceiver
    const smsReceiver = {
      $: {
        'android:name': '.SMSBroadcastReceiver',
        'android:enabled': 'true',
        'android:exported': 'true',
        'android:permission': 'android.permission.BROADCAST_SMS'
      },
      'intent-filter': [{
        $: { 'android:priority': '999' },
        action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }]
      }]
    };
    
    // Add NotificationActionReceiver
    const actionReceiver = {
      $: {
        'android:name': '.NotificationActionReceiver',
        'android:enabled': 'true',
        'android:exported': 'false'
      },
      'intent-filter': [{
        action: [{ $: { 'android:name': 'IGNORE_TRANSACTION' } }]
      }]
    };
    
    // Check if receivers already exist
    const hasSmsReceiver = application.receiver.some(r => 
      r.$['android:name'] === '.SMSBroadcastReceiver'
    );
    const hasActionReceiver = application.receiver.some(r => 
      r.$['android:name'] === '.NotificationActionReceiver'
    );
    
    if (!hasSmsReceiver) {
      application.receiver.push(smsReceiver);
    }
    
    if (!hasActionReceiver) {
      application.receiver.push(actionReceiver);
    }
    
    return config;
  });
  
  // Step 2: Inject Kotlin files using dangerous mod
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidProjectPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'jman',
        'finesseeas'
      );
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(androidProjectPath)) {
        fs.mkdirSync(androidProjectPath, { recursive: true });
      }
      
      // Write Kotlin files
      Object.entries(KOTLIN_FILES).forEach(([filename, content]) => {
        if (filename !== 'MainApplication.kt') {
          const filePath = path.join(androidProjectPath, filename);
          fs.writeFileSync(filePath, content, 'utf-8');
          console.log(`✅ Created: ${filename}`);
        }
      });
      
      // Modify MainApplication.kt to register TransactionPackage
      const mainAppPath = path.join(androidProjectPath, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
        let mainAppContent = fs.readFileSync(mainAppPath, 'utf-8');
        
        // Add import if not present
        if (!mainAppContent.includes('import com.jman.finesseeas.TransactionPackage')) {
          mainAppContent = mainAppContent.replace(
            /package com\.jman\.finesseeas/,
            `package com.jman.finesseeas\n\nimport com.jman.finesseeas.TransactionPackage`
          );
        }
        
        // Add package to getPackages() if not present
        if (!mainAppContent.includes('TransactionPackage()')) {
          if (mainAppContent.includes('val packages = PackageList(this).packages')) {
            mainAppContent = mainAppContent.replace(
              /val packages = PackageList\(this\)\.packages/,
              `val packages = PackageList(this).packages\n            packages.add(TransactionPackage())`
            );
          } else if (mainAppContent.includes('PackageList(this).packages.apply {')) {
            mainAppContent = mainAppContent.replace(
              /PackageList\(this\)\.packages\.apply \{/,
              `PackageList(this).packages.apply {\n          add(TransactionPackage())`
            );
          }
        }
        
        fs.writeFileSync(mainAppPath, mainAppContent, 'utf-8');
        console.log('✅ Modified: MainApplication.kt');
      }
      
      // Modify MainActivity.kt to handle onNewIntent
      const mainActivityPath = path.join(androidProjectPath, 'MainActivity.kt');
      if (fs.existsSync(mainActivityPath)) {
        let mainActivityContent = fs.readFileSync(mainActivityPath, 'utf-8');
        
        // Add import if not present
        if (!mainActivityContent.includes('import android.content.Intent')) {
          mainActivityContent = mainActivityContent.replace(
            /package com\.jman\.finesseeas/,
            `package com.jman.finesseeas\n\nimport android.content.Intent`
          );
        }
        
        // Add onNewIntent override if not present
        if (!mainActivityContent.includes('override fun onNewIntent')) {
          const onNewIntentMethod = `
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }`;
          
          // Insert before the last closing brace
          mainActivityContent = mainActivityContent.replace(/(\}\s*$)/, `\n${onNewIntentMethod}\n$1`);
        }
        
        fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf-8');
        console.log('✅ Modified: MainActivity.kt');
      }
      
      return config;
    }
  ]);
  
  return config;
}

module.exports = withSmsListener;
