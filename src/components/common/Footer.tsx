import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-500">
            © 株式会社ウォーカー 新人類育成計画/BizITCo
          </div>
          <div className="flex space-x-6 text-sm">
            <button
              onClick={() => navigate('/terms')}
              className="text-gray-600 hover:text-gray-900"
            >
              利用規約
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="text-gray-600 hover:text-gray-900"
            >
              プライバシーポリシー
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
