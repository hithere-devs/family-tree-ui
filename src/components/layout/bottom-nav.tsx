import { Leaf, Menu, User } from 'lucide-react';
import React from 'react';

interface BottomNavProps {
	onViewChange: (view: 'tree' | 'gallery' | 'profile' | 'menu') => void;
	activeView: 'tree' | 'gallery' | 'profile' | 'menu';
}

export const BottomNav: React.FC<BottomNavProps> = ({
	onViewChange,
	activeView,
}) => {
	const items = [
		{
			key: 'menu' as const,
			icon: Menu,
			label: 'Menu',
			size: 24,
			accent: false,
		},
		{ key: 'tree' as const, icon: Leaf, label: 'Tree', size: 28, accent: true },
		{
			key: 'profile' as const,
			icon: User,
			label: 'Profile',
			size: 24,
			accent: false,
		},
	];

	return (
		<>
			{/* ── Mobile bottom bar ── */}
			<div
				className='flex md:hidden w-full items-center justify-around rounded-t-3xl bg-white px-2 pt-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]'
				style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
			>
				{items.map((item) => (
					<button
						key={item.key}
						onClick={() => onViewChange(item.key)}
						className={
							item.accent
								? `relative -top-8 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 ${
										activeView === 'tree'
											? 'bg-lime-500 text-white'
											: 'bg-white text-gray-400'
									}`
								: `flex flex-col items-center justify-center space-y-1 ${
										activeView === item.key ? 'text-lime-500' : 'text-gray-400'
									}`
						}
					>
						<item.icon size={item.size} />
					</button>
				))}
			</div>

			{/* ── Desktop sidebar ── */}
			<div className='hidden md:flex flex-col items-center justify-between w-16 lg:w-56 shrink-0 border-r border-gray-200 bg-white py-6'>
				{/* Logo */}
				<div className='flex flex-col items-center lg:items-start lg:px-4 gap-1 w-full'>
					<div className='flex items-center gap-2 mb-6'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500 text-white shadow'>
							<Leaf size={22} />
						</div>
						<span className='hidden lg:block text-lg font-bold text-gray-800'>
							Family Tree
						</span>
					</div>

					{/* Nav items */}
					{items.map((item) => {
						const active = activeView === item.key;
						return (
							<button
								key={item.key}
								onClick={() => onViewChange(item.key)}
								className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
									active
										? 'bg-lime-50 text-lime-600'
										: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
								}`}
							>
								<item.icon size={20} />
								<span className='hidden lg:block text-sm font-medium'>
									{item.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</>
	);
};
