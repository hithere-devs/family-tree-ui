/**
 * HTML overlay anchored to a selected canvas node.
 * Shows spatial action buttons (Add Parent / Spouse / Child / Sibling).
 * Only 0–1 instance ever exists in the DOM.
 */

import { Plus } from 'lucide-react';

interface NodeOverlayProps {
	/** Screen-space CSS pixel position (center of node) */
	screenX: number;
	screenY: number;
	personId: string;
	onAddRelation: (
		personId: string,
		relation: 'parent' | 'child' | 'spouse' | 'sibling',
	) => void;
}

const BUTTONS = [
	{
		relation: 'parent' as const,
		label: 'Parent',
		offset: { x: 0, y: -80 },
		color: 'bg-violet-500 hover:bg-violet-600',
	},
	{
		relation: 'spouse' as const,
		label: 'Spouse',
		offset: { x: 85, y: -20 },
		color: 'bg-pink-500 hover:bg-pink-600',
	},
	{
		relation: 'child' as const,
		label: 'Child',
		offset: { x: 0, y: 60 },
		color: 'bg-blue-500 hover:bg-blue-600',
	},
	{
		relation: 'sibling' as const,
		label: 'Sibling',
		offset: { x: -85, y: -20 },
		color: 'bg-amber-500 hover:bg-amber-600',
	},
];

export function NodeOverlay({
	screenX,
	screenY,
	personId,
	onAddRelation,
}: NodeOverlayProps) {
	return (
		<div
			className='absolute pointer-events-none z-20'
			style={{
				left: screenX,
				top: screenY,
				transform: 'translate(-50%, -50%)',
			}}
		>
			{BUTTONS.map((btn) => (
				<button
					key={btn.relation}
					className={`pointer-events-auto absolute flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold text-white shadow-lg ring-2 ring-white transition-all ${btn.color}`}
					style={{
						left: btn.offset.x,
						top: btn.offset.y,
						transform: 'translate(-50%, -50%)',
					}}
					onClick={(e) => {
						e.stopPropagation();
						onAddRelation(personId, btn.relation);
					}}
					onTouchEnd={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onAddRelation(personId, btn.relation);
					}}
				>
					<Plus size={12} />
					{btn.label}
				</button>
			))}
		</div>
	);
}
