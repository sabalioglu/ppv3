@@ .. @@
  // Loading message management
  const [loadingMessage, setLoadingMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  
-  const getLoadingMessages = (url: string) => {
-    return [
-      "Extracting recipe...",
-      "Processing content...",
-      "Analyzing ingredients...",
-      "Getting instructions...",
-      "Almost done...",
-      "Finalizing recipe..."
-    ];
-  };
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
+  };
 
   useEffect(() => {
     if (isLoading) {