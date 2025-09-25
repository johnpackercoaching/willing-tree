import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Calendar, TreePine, Heart, Brain, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Innermost, WillingBox } from '../types';

interface WeeklyStatusCardProps {
  innermost: Innermost;
  willingBox?: WillingBox | null;
  currentUserId: string;
}

export const WeeklyStatusCard: FC<WeeklyStatusCardProps> = ({
  innermost,
  willingBox,
  currentUserId,
}) => {
  const isPartnerA = innermost.partnerA === currentUserId;
  const partnerName = isPartnerA ? innermost.partnerBName : innermost.partnerAName;

  // Determine the current action needed
  const getActionInfo = () => {
    if (!willingBox) {
      return {
        icon: TreePine,
        title: 'Start Week 1',
        description: 'Begin planting your first wishes',
        action: 'Plant Trees',
        link: `/innermosts/${innermost.id}/wants`,
        color: 'primary',
        urgent: false,
      };
    }

    const userWishList = isPartnerA ? willingBox.partnerAWishList : willingBox.partnerBWishList;
    const userWillingList = isPartnerA ? willingBox.partnerAWillingList : willingBox.partnerBWillingList;
    const partnerWishList = isPartnerA ? willingBox.partnerBWishList : willingBox.partnerAWishList;

    switch (willingBox.status) {
      case 'planting_trees':
        if (!userWishList || userWishList.length === 0) {
          return {
            icon: TreePine,
            title: `Week ${willingBox.weekNumber}: Plant Your Trees`,
            description: 'Create 12 wishes for your partner',
            action: 'Plant Trees',
            link: `/innermosts/${innermost.id}/wants`,
            color: 'primary',
            urgent: true,
          };
        } else if (!partnerWishList || partnerWishList.length === 0) {
          return {
            icon: Clock,
            title: `Week ${willingBox.weekNumber}: Waiting`,
            description: `Waiting for ${partnerName} to plant their trees`,
            action: null,
            link: null,
            color: 'gray',
            urgent: false,
          };
        } else {
          return {
            icon: Heart,
            title: `Week ${willingBox.weekNumber}: Ready to Select`,
            description: 'Both wish lists are ready!',
            action: 'Select Willing',
            link: `/innermosts/${innermost.id}/willing`,
            color: 'willing',
            urgent: true,
          };
        }

      case 'selecting_willing':
        if (!userWillingList || userWillingList.length === 0) {
          return {
            icon: Heart,
            title: `Week ${willingBox.weekNumber}: Select Your Willing`,
            description: `Choose 3 wishes you're willing to do for ${partnerName}`,
            action: 'Select Willing',
            link: `/innermosts/${innermost.id}/willing`,
            color: 'willing',
            urgent: true,
          };
        } else {
          return {
            icon: Clock,
            title: `Week ${willingBox.weekNumber}: Waiting`,
            description: `Waiting for ${partnerName} to select their willing`,
            action: null,
            link: null,
            color: 'gray',
            urgent: false,
          };
        }

      case 'guessing':
        return {
          icon: Brain,
          title: `Week ${willingBox.weekNumber}: Time to Guess`,
          description: `Guess which wishes ${partnerName} is willing to do`,
          action: 'Make Guesses',
          link: `/innermosts/${innermost.id}/guess/${willingBox.weekNumber}`,
          color: 'accent',
          urgent: true,
        };

      case 'revealed':
        return {
          icon: CheckCircle,
          title: `Week ${willingBox.weekNumber}: Complete`,
          description: 'This week is complete. Great job!',
          action: 'View Results',
          link: `/innermosts/${innermost.id}/results/${willingBox.weekNumber}`,
          color: 'green',
          urgent: false,
        };

      default:
        return {
          icon: AlertCircle,
          title: 'Status Unknown',
          description: 'Please refresh the page',
          action: null,
          link: null,
          color: 'gray',
          urgent: false,
        };
    }
  };

  const actionInfo = getActionInfo();
  const Icon = actionInfo.icon;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'willing':
        return 'bg-willing-50 border-willing-200 text-willing-700';
      case 'accent':
        return 'bg-accent-50 border-accent-200 text-accent-700';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const colorClasses = getColorClasses(actionInfo.color);

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses} ${actionInfo.urgent ? 'animate-pulse-subtle' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${actionInfo.color === 'primary' ? 'bg-primary-100' : actionInfo.color === 'willing' ? 'bg-willing-100' : actionInfo.color === 'accent' ? 'bg-accent-100' : 'bg-gray-100'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{actionInfo.title}</h3>
            <p className="text-xs opacity-80 mt-1">{actionInfo.description}</p>
          </div>
        </div>
        {actionInfo.urgent && (
          <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-white rounded-full">
            <AlertCircle className="w-3 h-3" />
            Action needed
          </div>
        )}
      </div>

      {actionInfo.action && actionInfo.link && (
        <Link to={actionInfo.link}>
          <Button
            fullWidth
            size="sm"
            variant={actionInfo.color === 'primary' ? 'primary' : 'secondary'}
            className="mt-2"
          >
            {actionInfo.action}
          </Button>
        </Link>
      )}

      {/* Progress indicator */}
      {willingBox && (
        <div className="mt-4 pt-3 border-t border-current opacity-20">
          <div className="flex items-center justify-between text-xs">
            <span>Week {willingBox.weekNumber} of 12</span>
            <div className="flex gap-1">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < willingBox.weekNumber ? 'bg-current' : 'bg-current opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};