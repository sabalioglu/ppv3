@@ .. @@
 import { useRouter } from 'expo-router';
 import { supabase } from '@/lib/supabase';
 import { colors, spacing, typography, shadows } from '@/lib/theme';
-import { Search, Filter, Plus, X, Link, ChevronRight, Share2, Camera, Edit3, Bookmark, Instagram, TikTok, Youtube, Facebook } from 'lucide-react-native';
+import { Search, Filter, Plus, X, Link, ChevronRight, Share2, Camera, Edit3, Bookmark } from 'lucide-react-native';
 
 const { width } = Dimensions.get('window');
 
@@ .. @@
   id: 'socials',
   name: 'Socials',
   icon: Share2,
-  color: '#E4405F',
-  description: 'Social media recipes',
-  sources: [
-    { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F', description: 'Reels & posts' },
-    { id: 'tiktok', name: 'TikTok', icon: TikTok, color: '#000000', description: 'Video recipes' },
-    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000', description: 'Cooking videos' },
-    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2', description: 'Video recipes' }
-  ]
+  color: colors.secondary[500],
+  description: 'Social media videos'
 },
 {
   id: 'camera',
@@ .. @@
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
   const [selectedImportSource, setSelectedImportSource] = useState<string>('web');
   const [showURLImport, setShowURLImport] = useState(false);
-  const [showSocialSources, setShowSocialSources] = useState(false);
   const [showManualRecipe, setShowManualRecipe] = useState(false);
   const [urlInput, setUrlInput] = useState('');
   const [isImporting, setIsImporting] = useState(false);
@@ .. @@
   const handleImportCategorySelect = (categoryId: string) => {
     if (categoryId === 'camera') {
       router.push({
-        pathname: '/(tabs)/camera'
+        pathname: '/(tabs)/camera',
+        params: {
+          mode: 'recipe-scanner',
+          returnTo: 'library',
+          timestamp: Date.now().toString()
+        }
       });
     } else if (categoryId === 'manual') {
       setShowManualRecipe(true);
-    } else if (categoryId === 'web') {
-      setSelectedImportSource('web');
-      setShowURLImport(true);
     } else if (categoryId === 'socials') {
-      setShowSocialSources(true);
+      setSelectedImportSource('socials');
+      setShowURLImport(true);
+    } else if (categoryId === 'web') {
+      setSelectedImportSource('web');
+      setShowURLImport(true);
     }
   };
 
-  const handleSocialSourceSelect = (sourceId: string) => {
-    setShowSocialSources(false);
-    setSelectedImportSource(sourceId);
-    setShowURLImport(true);
-  };
-
@@ .. @@
   const getSourceInfo = () => {
     if (selectedSource === 'web') {
       return { 
-        name: 'Website', 
-        color: colors.primary[500], 
-        description: 'Any recipe website' 
+        name: 'Website',
+        color: colors.primary[500],
+        description: 'Any recipe website'
+      };
+    }
+    if (selectedSource === 'socials') {
+      return {
+        name: 'Social Media',
+        color: colors.secondary[500],
+        description: 'Import from social platforms'
       };
     }
     const allSources = importCategories.flatMap(cat => cat.sources || []);
@@ .. @@
   
   const getPlaceholderUrl = () => {
     if (selectedSource === 'web') return 'https://example.com/recipe';
-    if (selectedSource === 'instagram') return 'https://instagram.com/p/...';
-    if (selectedSource === 'tiktok') return 'https://tiktok.com/@user/video/...';
-    if (selectedSource === 'youtube') return 'https://youtube.com/watch?v=...';
-    if (selectedSource === 'facebook') return 'https://facebook.com/watch?v=...';
+    if (selectedSource === 'socials') return 'Paste your social media video link here...';
     return `https://example.com/...`;
   };
 
@@ .. @@
             <Text style={styles.urlModalSubtitle}>{sourceInfo.description}</Text>
             
             {/* Description */}
-            <Text style={styles.urlModalDescription}>
-              Paste a link from {sourceInfo.name} and our AI will automatically extract the recipe details, including ingredients, instructions, and nutritional information.
-            </Text>
+            <Text style={styles.urlModalDescription}>
+              {selectedImportSource === 'socials' 
+                ? 'Paste a video link from any supported social media platform'
+                : `Paste a link from ${sourceInfo.name} and our AI will automatically extract the recipe details, including ingredients, instructions, and nutritional information.`
+              }
+            </Text>
             
             {/* URL Input */}
             <View style={styles.urlInputContainer}>
@@ .. @@
             
             {/* Example URLs */}
             <View style={styles.exampleUrlsContainer}>
-              <Text style={styles.exampleUrlsTitle}>Supported formats:</Text>
-              <Text style={styles.exampleUrlsText}>
-                - Recipe posts and articles
-                - Food blog recipes
-                - Cooking websites
-                - Recipe sharing platforms
-              </Text>
+              <Text style={styles.exampleUrlsTitle}>
+                {selectedImportSource === 'socials' ? 'Supported platforms:' : 'Supported formats:'}
+              </Text>
+              <Text style={styles.exampleUrlsText}>
+                {selectedImportSource === 'socials' 
+                  ? '• TikTok\n• Instagram\n• YouTube\n• Facebook'
+                  : '- Recipe posts and articles\n- Food blog recipes\n- Cooking websites\n- Recipe sharing platforms'
+                }
+              </Text>
             </View>
             
             {/* Import Button */}
@@ .. @@
         </View>
       </Modal>
       
-      {/* Social Source Modal */}
-      <Modal
-        visible={showSocialSources}
-        transparent={true}
-        animationType="slide"
-        onRequestClose={() => setShowSocialSources(false)}
-      >
-        <View style={styles.socialModalContainer}>
-          <View style={styles.socialModalHeader}>
-            <View style={styles.socialModalTitleContainer}>
-              <View style={[styles.socialModalIconContainer, { backgroundColor: '#E4405F20' }]}>
-                <Share2 size={24} color="#E4405F" />
-              </View>
-              <View>
-                <Text style={styles.socialModalTitle}>Import from Social Media</Text>
-                <Text style={styles.socialModalSubtitle}>Select a platform</Text>
-              </View>
-            </View>
-            <TouchableOpacity
-              style={styles.socialModalCloseButton}
-              onPress={() => setShowSocialSources(false)}
-            >
-              <X size={24} color={colors.neutral[600]} />
-            </TouchableOpacity>
-          </View>
-          
-          <View style={styles.socialSourcesGrid}>
-            {importCategories
-              .find(cat => cat.id === 'socials')
-              ?.sources?.map(source => (
-                <TouchableOpacity
-                  key={source.id}
-                  style={styles.socialSourceCard}
-                  onPress={() => handleSocialSourceSelect(source.id)}
-                >
-                  <View style={[styles.socialSourceIconContainer, { backgroundColor: `${source.color}20` }]}>
-                    <source.icon size={32} color={source.color} />
-                  </View>
-                  <Text style={styles.socialSourceName}>{source.name}</Text>
-                  <Text style={styles.socialSourceDescription}>{source.description}</Text>
-                </TouchableOpacity>
-              ))}
-          </View>
-        </View>
-      </Modal>
-      
@@ .. @@
     paddingVertical: spacing.md,
     marginBottom: spacing.lg,
   },
-  socialModalContainer: {
-    flex: 1,
-    backgroundColor: 'rgba(0, 0, 0, 0.5)',
-    justifyContent: 'flex-end',
-  },
-  socialModalHeader: {
-    flexDirection: 'row',
-    justifyContent: 'space-between',
-    alignItems: 'center',
-    backgroundColor: colors.neutral[0],
-    borderTopLeftRadius: 24,
-    borderTopRightRadius: 24,
-    paddingHorizontal: spacing.lg,
-    paddingTop: spacing.xl,
-    paddingBottom: spacing.lg,
-  },
-  socialModalTitleContainer: {
-    flexDirection: 'row',
-    alignItems: 'center',
-  },
-  socialModalIconContainer: {
-    width: 48,
-    height: 48,
-    borderRadius: 12,
-    justifyContent: 'center',
-    alignItems: 'center',
-    marginRight: spacing.md,
-  },
-  socialModalTitle: {
-    fontSize: typography.fontSize.xl,
-    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
-    color: colors.neutral[800],
-  },
-  socialModalSubtitle: {
-    fontSize: typography.fontSize.base,
-    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
-    color: colors.neutral[600],
-  },
-  socialModalCloseButton: {
-    width: 48,
-    height: 48,
-    borderRadius: 24,
-    backgroundColor: colors.neutral[100],
-    justifyContent: 'center',
-    alignItems: 'center',
-  },
-  socialSourcesGrid: {
-    backgroundColor: colors.neutral[0],
-    paddingHorizontal: spacing.lg,
-    paddingBottom: spacing.xl * 2,
-    flexDirection: 'row',
-    flexWrap: 'wrap',
-    justifyContent: 'space-between',
-  },
-  socialSourceCard: {
-    width: (width - spacing.lg * 2 - spacing.md) / 2,
-    backgroundColor: colors.neutral[0],
-    borderRadius: 16,
-    padding: spacing.lg,
-    marginBottom: spacing.md,
-    alignItems: 'center',
-    borderWidth: 1,
-    borderColor: colors.neutral[200],
-  },
-  socialSourceIconContainer: {
-    width: 64,
-    height: 64,
-    borderRadius: 16,
-    justifyContent: 'center',
-    alignItems: 'center',
-    marginBottom: spacing.md,
-  },
-  socialSourceName: {
-    fontSize: typography.fontSize.lg,
-    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Poppins-SemiBold',
-    color: colors.neutral[800],
-    marginBottom: spacing.xs,
-  },
-  socialSourceDescription: {
-    fontSize: typography.fontSize.sm,
-    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter-Regular',
-    color: colors.neutral[600],
-    textAlign: 'center',
-  },
   importSourceCard: {
-    width: (width - spacing.lg * 2 - spacing.md * 3) / 4,
-    backgroundColor: colors.neutral[0],
+    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3, // This stays the same for 3 items
+    backgroundColor: colors.neutral[50],
     borderRadius: 16,
     padding: spacing.lg,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: colors.neutral[200],
+    minHeight: 140, // Add minimum height for better appearance
   },
   importSourceIcon: {
     width: 48,