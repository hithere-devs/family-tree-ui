import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Person } from '../types';
import { getAvatarUrl } from '../utils/avatar';
import { useFamilyTree } from '../state/family-tree-context';

interface PersonNodeProps {
	person: Person;
	x: number;
	y: number;
	isCenter: boolean;
	isSelected: boolean;
	/** Single-tap: select the node (and in admin mode toggle floating buttons) */
	onClick: () => void;
	/** Double-tap: open the profile sheet */
	onOpen: () => void;
}

export const NODE_W = 120;
export const NODE_H = 140;

/* Four spatial relationship buttons around the node */
const ACTION_BUTTONS = [
	{
		relation: 'parent' as const,
		label: 'Parent',
		style: { top: -18, left: '50%', transform: 'translateX(-50%)' },
		color: 'bg-violet-500 hover:bg-violet-600',
	},
	{
		relation: 'spouse' as const,
		label: 'Spouse',
		style: {
			top: '32%',
			left: '100%',
			marginLeft: 6,
			transform: 'translateY(-50%)',
		},
		color: 'bg-pink-500 hover:bg-pink-600',
	},
	{
		relation: 'child' as const,
		label: 'Child',
		style: { bottom: -18, left: '50%', transform: 'translateX(-50%)' },
		color: 'bg-blue-500 hover:bg-blue-600',
	},
	{
		relation: 'sibling' as const,
		label: 'Sibling',
		style: {
			top: '32%',
			right: '100%',
			marginRight: 6,
			transform: 'translateY(-50%)',
		},
		color: 'bg-amber-500 hover:bg-amber-600',
	},
];

export function PersonNode({
	person,
	x,
	y,
	isCenter,
	isSelected,
	onClick,
	onOpen,
}: PersonNodeProps) {
	const { dispatch } = useFamilyTree();
	const [showActions, setShowActions] = useState(false);

	/* Mobile double-tap detection */
	const lastTapRef = useRef<number>(0);

	const avatarUrl = getAvatarUrl(person);
	const label = isCenter ? 'me' : person.firstName;

	/* ---- Desktop click ---- */
	function handleClick(e: React.MouseEvent) {
		e.stopPropagation();

		if (e.detail >= 2) {
			// Double-click → open profile
			setShowActions(false);
			onOpen();
			return;
		}

		// Single click
		onClick(); // SELECT_PERSON in parent
		setShowActions((prev) => !prev);
	}

	/* ---- Touch double-tap ---- */
	function handleTouchEnd(e: React.TouchEvent) {
		e.stopPropagation();
		e.preventDefault(); // prevent synthetic click from firing after touch
		const now = Date.now();
		const delta = now - lastTapRef.current;
		lastTapRef.current = now;

		if (delta < 300 && delta > 0) {
			// Double-tap → open profile
			setShowActions(false);
			onOpen();
		} else {
			// Single tap
			onClick();
			setShowActions((prev) => !prev);
		}
	}

	/* Collapse floating buttons when this node loses selection */
	useEffect(() => {
		if (!isSelected) setShowActions(false);
	}, [isSelected]);

	return (
		<div
			className='absolute flex flex-col items-center justify-center transition-transform hover:scale-105'
			style={{
				left: x - NODE_W / 2,
				top: y - NODE_H / 2,
				width: NODE_W,
				height: NODE_H,
			}}
			onClick={handleClick}
			onTouchEnd={handleTouchEnd}
		>
			{/* Floating action buttons — shown on single tap */}
			{showActions &&
				ACTION_BUTTONS.map((btn) => (
					<button
						key={btn.relation}
						className={`absolute z-20 flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold text-white shadow-lg ring-2 ring-white transition-all ${btn.color}`}
						style={btn.style as React.CSSProperties}
						onClick={(e) => {
							e.stopPropagation();
							setShowActions(false);
							dispatch({
								type: 'OPEN_ADD_PERSON_MODAL',
								relativePersonId: person.id,
								relationType: btn.relation,
							});
						}}
						onTouchEnd={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setShowActions(false);
							dispatch({
								type: 'OPEN_ADD_PERSON_MODAL',
								relativePersonId: person.id,
								relationType: btn.relation,
							});
						}}
					>
						<Plus size={12} />
						{btn.label}
					</button>
				))}

			{/* Avatar Circle */}
			<div
				className={`relative mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 shadow-md transition-all ${
					isSelected ? 'border-lime-500 ring-4 ring-lime-100' : 'border-white'
				} ${person.isDeceased ? 'grayscale' : ''}`}
			>
				<img
					src={avatarUrl}
					alt={person.firstName}
					className='h-full w-full object-cover'
				/>
			</div>

			{/* Name Label */}
			<div
				className={`flex flex-col items-center rounded-md px-1.5 py-0.5 text-center transition-colors ${
					showActions ? 'bg-gray-900/80' : ''
				}`}
			>
				<span
					className={`text-center text-sm font-semibold ${showActions ? 'text-white' : 'text-gray-700'}`}
				>
					{label}
				</span>
				{person.lastName && (
					<span
						className={`text-center text-[10px] ${showActions ? 'text-gray-300' : 'text-gray-400'}`}
					>
						{person.lastName}
					</span>
				)}
			</div>
		</div>
	);
}
