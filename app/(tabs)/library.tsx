import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, shadows } from '@/lib/theme';
import { Search, Filter, Plimport { Search, Filter, Plus, X, Link, ChevronRight, Share2, Camera, CreditCard as Edit3, Bookmark } from 'lucide-react-native'

const { width } = Dimensions.get('window');

{
  id: 'socials',
  name: 'Socials',
  icon: Share2,
  color: colors.secondary[500],
  description: 'Social media videos'
},
{
  id: 'camera',
  name: 'Camera',
  icon: Camera,
  color: colors.primary[500],
  description: 'Scan a recipe'
}

const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [selectedImportSource, setSelectedImportSource] = useState<string>('web');
const [showURLImport, setShowURLImport] = useState(false);
const [showManualRecipe, setShowManualRecipe] = useState(false);
const [urlInput, setUrlInput] = useState('');
const [isImporting, setIsImporting] = useState(false);

const handleImportCategorySelect = (categoryId: string) => {
    if (categoryId === 'camera') {
      router.push({
        pathname: '/(tabs)/camera',
        params: {
          mode: 'recipe-scanner',
          returnTo: 'library',
          timestamp: Date.now().toString()
        }
      });
    } else if (categoryId === 'manual') {
      setShowManualRecipe(true);
    } else if (categoryId === 'socials') {
      setSelectedImportSource('socials');
      setShowURLImport(true);
    } else if (categoryId === 'web') {
      setSelectedImportSource('web');
      setShowURLImport(true);
    }
};

const getSourceInfo = () => {
    if (selectedSource === 'web') {
      return { 
        name: 'Website',
        color: colors.primary[500],
        description: 'Any recipe website'
      };
    }
    if (selectedSource === 'socials') {
      return {
        name: 'Social Media',
        color: colors.secondary[500],
        description: 'Import from social platforms'
      };
    }
    const allSources = importCategories.flatMap(cat => cat.sources || []);
};

const getPlaceholderUrl = () => {
    if (selectedSource === 'web') return 'https://example.com/recipe';
    if (selectedSource === 'socials') return 'Paste your social media video link here...';
    return `https://example.com/...`;
};

<Text style={styles.urlModalSubtitle}>{sourceInfo.description}</Text>
            
{/* Description */}
<Text style={styles.urlModalDescription}>
  {selectedImportSource === 'socials' 
    ? 'Paste a video link from any supported social media platform'
    : `Paste a link from ${sourceInfo.name} and our AI will automatically extract the recipe details, including ingredients, instructions, and nutritional information.`
  }
</Text>
            
{/* URL Input */}
<View style={styles.urlInputContainer}>

{/* Example URLs */}
<View style={styles.exampleUrlsContainer}>
  <Text style={styles.exampleUrlsTitle}>
    {selectedImportSource === 'socials' ? 'Supported platforms:' : 'Supported formats:'}
  </Text>
  <Text style={styles.exampleUrlsText}>
    {selectedImportSource === 'socials' 
      ? '• TikTok\n• Instagram\n• YouTube\n• Facebook'
      : '- Recipe posts and articles\n- Food blog recipes\n- Cooking websites\n- Recipe sharing platforms'
    }
  </Text>
</View>
            
{/* Import Button */}

const styles = StyleSheet.create({
  paddingVertical: spacing.md,
  marginBottom: spacing.lg,
  importSourceCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3, // This stays the same for 3 items
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    minHeight: 140, // Add minimum height for better appearance
  },
  importSourceIcon: {
    width: 48,
  }
});