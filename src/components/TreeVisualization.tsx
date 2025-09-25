import { FC } from 'react';
import { TreePine, Leaf, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

interface TreeVisualizationProps {
  growthPercentage: number; // 0-100
  leavesCount: number;
  status: 'seed' | 'sprout' | 'young' | 'mature' | 'flourishing';
}

export const TreeVisualization: FC<TreeVisualizationProps> = ({
  growthPercentage,
  leavesCount,
  status,
}) => {
  // Determine tree size and color based on growth
  const getTreeStyle = () => {
    if (growthPercentage < 20) {
      return {
        size: 'w-8 h-8',
        color: 'text-tree-400',
        bgColor: 'bg-tree-50',
        borderColor: 'border-tree-200',
      };
    } else if (growthPercentage < 40) {
      return {
        size: 'w-10 h-10',
        color: 'text-tree-500',
        bgColor: 'bg-tree-100',
        borderColor: 'border-tree-300',
      };
    } else if (growthPercentage < 60) {
      return {
        size: 'w-12 h-12',
        color: 'text-primary-500',
        bgColor: 'bg-primary-50',
        borderColor: 'border-primary-200',
      };
    } else if (growthPercentage < 80) {
      return {
        size: 'w-14 h-14',
        color: 'text-primary-600',
        bgColor: 'bg-primary-100',
        borderColor: 'border-primary-300',
      };
    } else {
      return {
        size: 'w-16 h-16',
        color: 'text-willing-600',
        bgColor: 'bg-gradient-to-br from-primary-100 to-willing-100',
        borderColor: 'border-willing-300',
      };
    }
  };

  const treeStyle = getTreeStyle();

  // Get the appropriate icon based on status
  const TreeIcon = status === 'seed' ? Sprout : TreePine;

  return (
    <div className="relative inline-block">
      {/* Tree container with growth animation */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className={`relative ${treeStyle.size} ${treeStyle.bgColor} rounded-full border-2 ${treeStyle.borderColor} flex items-center justify-center`}
      >
        <TreeIcon className={`${treeStyle.color} w-1/2 h-1/2`} />

        {/* Growth percentage indicator */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, rgba(34, 197, 94, 0.2) 0deg, rgba(34, 197, 94, 0.2) ${growthPercentage * 3.6}deg, transparent ${growthPercentage * 3.6}deg)`,
          }}
        />
      </motion.div>

      {/* Leaves indicator */}
      {leavesCount > 0 && (
        <div className="absolute -top-2 -right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-willing-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg"
          >
            {leavesCount}
          </motion.div>
          <Leaf className="absolute -bottom-1 -left-1 w-3 h-3 text-willing-600" />
        </div>
      )}

      {/* Status label */}
      <div className="mt-2 text-center">
        <div className="text-xs font-medium capitalize text-tree-700">{status}</div>
        <div className="text-xs text-tree-500">{growthPercentage}% grown</div>
      </div>
    </div>
  );
};

interface TreeCollectionProps {
  trees: Array<{
    id: string;
    name: string;
    growthPercentage: number;
    leavesCount: number;
    status: 'seed' | 'sprout' | 'young' | 'mature' | 'flourishing';
  }>;
}

export const TreeCollection: FC<TreeCollectionProps> = ({ trees }) => {
  if (trees.length === 0) {
    return (
      <div className="text-center py-8">
        <Sprout className="w-12 h-12 text-tree-400 mx-auto mb-3" />
        <p className="text-tree-600">No trees planted yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {trees.map((tree) => (
        <div key={tree.id} className="flex flex-col items-center">
          <TreeVisualization
            growthPercentage={tree.growthPercentage}
            leavesCount={tree.leavesCount}
            status={tree.status}
          />
          <div className="mt-2 text-xs text-tree-700 font-medium max-w-[80px] truncate">
            {tree.name}
          </div>
        </div>
      ))}
    </div>
  );
};