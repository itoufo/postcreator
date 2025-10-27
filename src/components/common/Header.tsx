import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              PostCreator
            </h1>
          </div>

          <nav className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              ダッシュボード
            </button>
            <button
              onClick={() => navigate('/accounts')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              アカウント管理
            </button>
            <button
              onClick={() => navigate('/generator')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              投稿生成
            </button>
            <button
              onClick={() => navigate('/history')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              履歴
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              設定
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              {profile?.display_name || user?.email}
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
