// components/meal-plan/QualityIndicator.tsx
// Quality score display component for meal cards
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, X, Shield, TrendingUp } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '../../lib/theme';
import { Meal } from '../../lib/meal-plan/types';
import { getQualityMetrics } from '../../lib/meal-plan/quality-control';

interface QualityIndicatorProps {
  meal: Meal;
  showDetails?: boolean;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({ 
  meal, 
  showDetails = true 
}) => {
  const [showModal, setShowModal] = useState(false);
  const qualityData = getQualityMetrics(meal);
  
  if (!qualityData.hasQualityData) {
    return null;
  }
  
  const getColorForConfidence = (confidence: number) => {
    if (confidence >= 80) return colors.success[500];
    if (confidence >= 60) return colors.warning[500];
    return colors.error[500];
  };
  
  const getIconForConfidence = (confidence: number) => {
    if (confidence >= 80) return CheckCircle;
    if (confidence >= 60) return AlertTriangle;
    return AlertTriangle;
  };
  
  const confidence = qualityData.score || 0;
  const IconComponent = getIconForConfidence(confidence);
  const color = getColorForConfidence(confidence);
  
  const QualityDetailsModal = () => (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quality Assessment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.overallScore}>
              <View style={[styles.scoreCircle, { borderColor: color }]}>
                <Text style={[styles.scoreText, { color }]}>
                  {Math.round(confidence)}
                </Text>
              </View>
              <Text style={styles.scoreLabel}>Overall Quality Score</Text>
            </View>
            
            {qualityData.issues && qualityData.issues.length > 0 && (
              <View style={styles.issuesSection}>
                <Text style={styles.issuesTitle}>Quality Issues:</Text>
                {qualityData.issues.map((issue: any, index: number) => (
                  <View key={index} style={styles.issueItem}>
                    <View style={styles.issueHeader}>
                      <Text style={styles.issueStageName}>{issue.stageName}</Text>
                      <View style={[
                        styles.issueStatus,
                        { backgroundColor: issue.passed ? colors.success[50] : colors.error[50] }
                      ]}>
                        <Text style={[
                          styles.issueStatusText,
                          { color: issue.passed ? colors.success[700] : colors.error[700] }
                        ]}>
                          {issue.passed ? 'PASSED' : 'FAILED'}
                        </Text>
                      </View>
                    </View>
                    
                    {issue.issues && issue.issues.length > 0 && (
                      <View style={styles.issueDetails}>
                        {issue.issues.map((detail: string, detailIndex: number) => (
                          <Text key={detailIndex} style={styles.issueDetail}>
                            • {detail}
                          </Text>
                        ))}
                      </View>
                    )}
                    
                    {issue.suggestion && (
                      <Text style={styles.issueSuggestion}>
                        💡 {issue.suggestion}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            
            {(meal as any).autoFixed && (
              <View style={styles.autoFixBanner}>
                <Shield size={16} color={colors.accent[600]} />
                <Text style={styles.autoFixText}>
                  This recipe was automatically improved by AI
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.qualityBadge, { backgroundColor: `${color}15` }]}
        onPress={showDetails ? () => setShowModal(true) : undefined}
        disabled={!showDetails}
      >
        <IconComponent size={12} color={color} />
        <Text style={[styles.qualityText, { color }]}>
          {Math.round(confidence)}%
        </Text>
      </TouchableOpacity>
      
      {qualityData.warning && (
        <View style={styles.warningIndicator}>
          <AlertTriangle size={10} color={colors.warning[600]} />
        </View>
      )}
      
      {(meal as any).autoFixed && (
        <View style={styles.autoFixIndicator}>
          <Shield size={10} color={colors.accent[600]} />
        </View>
      )}
      
      {showDetails && <QualityDetailsModal />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  qualityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  warningIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warning[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoFixIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    margin: spacing.lg,
    maxHeight: '80%',
    width: '90%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  overallScore: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[600],
  },
  issuesSection: {
    marginBottom: spacing.lg,
  },
  issuesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  issueItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  issueStageName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  issueStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  issueStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  issueDetails: {
    marginBottom: spacing.sm,
  },
  issueDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  issueSuggestion: {
    fontSize: typography.fontSize.sm,
    color: colors.accent[600],
    fontStyle: 'italic',
  },
  autoFixBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  autoFixText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent[700],
    fontWeight: '500',
  },
});