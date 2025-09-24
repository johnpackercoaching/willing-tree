import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useInnermostStore } from '../stores/innermostStore';
import { Button } from '../components/Button';
import { TreePine, Plus, Users, Trophy, Leaf, BarChart3 } from 'lucide-react';

export const HomePage: FC = () => {
  const { user } = useAuthStore();
  const { innermosts, canAddInnermost } = useInnermostStore();

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
          <TreePine className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-tree-900">The WillingTree</h1>
        <h2 className="text-lg text-tree-700 font-medium mt-1">Dashboard</h2>
        <p className="text-tree-600 text-sm mt-2">
          Welcome back, {user?.displayName}! Ready to nurture your relationships?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 text-center border border-tree-200">
          <TreePine className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-tree-900">{innermosts.length}</div>
          <div className="text-sm text-tree-600">Growing Trees</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-tree-200">
          <Leaf className="w-6 h-6 text-willing-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-tree-900">0</div>
          <div className="text-sm text-tree-600">Leaves Grown</div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4">
        {innermosts.length === 0 ? (
          <div className="bg-gradient-to-r from-bark-400 to-bark-500 rounded-xl p-6 text-white text-center">
            <TreePine className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h3 className="text-lg font-semibold mb-2">Plant Your First Tree</h3>
            <p className="text-bark-100 mb-4 text-sm">
              Connect with someone special and begin nurturing your relationship tree.
            </p>
            <Link to="/innermosts">
              <Button variant="secondary" className="bg-white text-bark-700 hover:bg-bark-50">
                <TreePine className="w-4 h-4 mr-2" />
                🌱 Plant a Tree
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-tree-900">Your Growing Trees</h2>
              {canAddInnermost() && (
                <Link to="/innermosts">
                  <Button size="sm" variant="ghost">
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Innermost Cards */}
            {innermosts.slice(0, 3).map((innermost) => {
              const partnerEmail = user?.id === innermost.partnerA ? innermost.partnerBEmail : innermost.partnerAEmail;
              
              return (
                <div key={innermost.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {partnerEmail || 'Partner'}
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      innermost.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {innermost.status.charAt(0).toUpperCase() + innermost.status.slice(1)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Created {innermost.createdAt.toLocaleDateString()}
                  </div>
                  <Link to={`/innermosts/${innermost.id}`}>
                    <Button size="sm" fullWidth>
                      {innermost.status === 'active' ? 'Tend to Tree' : 'Continue Planting'}
                    </Button>
                  </Link>
                </div>
              );
            })}
            
            {innermosts.length > 3 && (
              <Link to="/innermosts">
                <Button variant="ghost" fullWidth>
                  View All Trees ({innermosts.length})
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/innermosts">
          <Button variant="ghost" fullWidth className="h-16 flex-col">
            <TreePine className="w-6 h-6 mb-1" />
            <span className="text-xs">Trees</span>
          </Button>
        </Link>
        <Link to="/analytics">
          <Button variant="ghost" fullWidth className="h-16 flex-col">
            <BarChart3 className="w-6 h-6 mb-1" />
            <span className="text-xs">Analytics</span>
          </Button>
        </Link>
        <Link to="/profile">
          <Button variant="ghost" fullWidth className="h-16 flex-col">
            <Trophy className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </Link>
      </div>

      {/* Bottom spacing for safe area */}
      <div className="h-4 safe-area-bottom" />
    </div>
  );
};