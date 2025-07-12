@@ .. @@
   const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
   const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
 
-  // Generate loading messages based on URL
-  const getLoadingMessages = (url: string) => {
-    const baseMessages = [
-      "Extracting recipe from URL...",
-      "Analyzing website content...",
-      "Identifying ingredients...",
-      "Processing instructions...",
-      "Calculating nutrition information...",
-      "Preparing recipe for your library...",
-      "Almost done...",
-      "Finalizing your recipe..."
-    ];
-
-    // Platform-specific messages
-    const platformMessages: { [key: string]: string[] } = {
-      tiktok: [
-        "Analyzing TikTok video...",
-        "Extracting recipe from short-form content...",
-        "Processing video frames...",
-        "Identifying cooking steps from video..."
-      ],
-      instagram: [
-        "Processing Instagram content...",
-        "Analyzing recipe post...",
-        "Extracting details from Instagram...",
-        "Reading recipe caption and comments..."
-      ],
-      youtube: [
-        "Processing YouTube video...",
-        "Analyzing cooking tutorial...",
-        "Extracting recipe from video content...",
-        "Identifying ingredients and steps from video..."
-      ]
-    };
-
-    // Detect platform
-    let platform = 'general';
-    if (url.includes('tiktok.com')) platform = 'tiktok';
-    else if (url.includes('instagram.com')) platform = 'instagram';
-    else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
-
-    // Combine platform-specific + general messages
-    const specificMessages = platformMessages[platform] || [];
-    return [...specificMessages, ...baseMessages];
+  const getLoadingMessages = (url: string) => {
+    const baseMessages = [
+      "Extracting recipe...",
+      "Processing video content...",
+      "Analyzing ingredients...",
+      "Getting instructions...",
+      "Almost done...",
+      "Finalizing recipe..."
+    ];
+
+    // Platform-specific messages (shortened)
+    const platformMessages: { [key: string]: string[] } = {
+      tiktok: [
+        "Processing TikTok...",
+        "Extracting from video...",
+      ],
+      instagram: [
+        "Processing Instagram...",
+        "Reading recipe post...",
+      ],
+      youtube: [
+        "Processing YouTube...",
+        "Analyzing video...",
+      ]
+    };
+
+    // Detect platform
+    let platform = 'general';
+    if (url.includes('tiktok.com')) platform = 'tiktok';
+    else if (url.includes('instagram.com')) platform = 'instagram';
+    else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
+
+    // Combine platform-specific + general messages
+    const specificMessages = platformMessages[platform] || [];
+    return [...specificMessages, ...baseMessages].slice(0, 8);
   };
 
   // Start loading animation