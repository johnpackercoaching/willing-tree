import { FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '../Button';
import { Link } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '../../services/subscriptionService';

export interface UpgradePromptProps {
  feature: string;
  description?: string;
  benefits?: string[];
  onClose?: () => void;
  showModal?: boolean;
}

export const UpgradePrompt: FC<UpgradePromptProps> = ({
  feature,
  description,
  benefits,
  onClose,
  showModal = false
}) => {
  // Default premium benefits if none provided
  const defaultBenefits = SUBSCRIPTION_PLANS.find(p => p.id === 'premium')?.features || [];
  const displayBenefits = benefits || defaultBenefits;

  // Handle escape key for modal
  useEffect(() => {
    if (!showModal || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal, onClose]);

  const promptContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative ${showModal ? 'bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full' : 'bg-gradient-to-br from-primary-50 to-willing-50 rounded-xl p-6 border border-primary-200'}`}
    >
      {/* Close button for modal */}
      {showModal && onClose && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </motion.button>
      )}

      {/* Header with animated crown */}
      <div className="flex items-center mb-4">
        <motion.div
          animate={{
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
          className="mr-3"
        >
          <div className="relative">
            <Crown className="w-10 h-10 text-yellow-500" />
            <motion.div
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
              className="absolute inset-0 bg-yellow-400 blur-xl"
            />
          </div>
        </motion.div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">
            Upgrade to Premium
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Unlock {feature}
          </p>
        </div>
      </div>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-700 mb-6"
        >
          {description}
        </motion.p>
      )}

      {/* Benefits list with staggered animation */}
      <motion.div className="space-y-3 mb-6">
        {displayBenefits.slice(0, showModal ? 6 : 3).map((benefit, index) => (
          <motion.div
            key={benefit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="flex items-start"
          >
            <div className="flex-shrink-0 mt-0.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2 + index * 0.05,
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
              >
                <Check className="w-5 h-5 text-willing-600" />
              </motion.div>
            </div>
            <span className="ml-3 text-sm text-gray-700">{benefit}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Pricing highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-primary-100 to-willing-100 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Premium Plan</p>
            <p className="text-2xl font-bold text-gray-900">
              $1<span className="text-base font-normal text-gray-600">/month</span>
            </p>
          </div>
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </motion.div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link to="/subscription" className="flex-1">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-gradient-to-r from-primary-600 to-willing-600 hover:from-primary-700 hover:to-willing-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Upgrade Now
          </Button>
        </Link>

        {onClose && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="px-6"
          >
            Maybe Later
          </Button>
        )}
      </div>

      {/* Trust badge */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-center text-gray-500 mt-4"
      >
        Cancel anytime • Secure payment • Instant access
      </motion.p>
    </motion.div>
  );

  // If modal mode, wrap in overlay
  if (showModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content wrapper to prevent close on content click */}
          <div onClick={(e) => e.stopPropagation()}>
            {promptContent}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Inline mode
  return promptContent;
};