import React from 'react';

interface HeaderProps {
    activeFilter: 'All' | 'Sports' | 'Politics' | 'Crypto';
    setActiveFilter: (filter: 'All' | 'Sports' | 'Politics' | 'Crypto') => void;
}

const Header: React.FC<HeaderProps> = ({ activeFilter, setActiveFilter }) => {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <span className="text-xl font-bold tracking-tight">six-seven</span>
                    <div className="hidden md:flex space-x-6">
                        {['All', 'Sports', 'Politics', 'Crypto'].map((filter) => (
                            <span
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={`font-medium cursor-pointer transition-colors ${activeFilter === filter
                                    ? 'text-gray-900 font-bold'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {filter}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-emerald-600 font-medium">$12.17</span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Deposit</button>
                </div>
            </div>
        </header>
    );
};

export default Header;
