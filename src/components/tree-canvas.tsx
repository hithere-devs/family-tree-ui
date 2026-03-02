import { useRef, useState, useEffect, useMemo } from 'react';
import { useFamilyTree } from '../state/family-tree-context';
import { computeTreeLayout } from '../utils/tree-layout';
import { PersonNode, NODE_W, NODE_H } from './person-node';

/* ------------------------------------------------------------------ */
/*  Edge data types (pure data, no JSX in the memo)                    */
/* ------------------------------------------------------------------ */

interface SpouseEdge {
	key: string;
	type: 'spouse';
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

interface ParentChildEdge {
	key: string;
	type: 'parent-child';
	path: string;
	junctionX: number;
	childX: number;
	parentBottomY: number;
	midY: number;
	childTopY: number;
	color: string;
}

type EdgeData = SpouseEdge | ParentChildEdge;

/* ------------------------------------------------------------------ */
/*  Edge crossing detection & coloring                                 */
/* ------------------------------------------------------------------ */

const CROSSING_PALETTE = [
	'#6366f1', // indigo
	'#f59e0b', // amber
	'#10b981', // emerald
	'#ef4444', // red
	'#8b5cf6', // violet
	'#ec4899', // pink
	'#06b6d4', // cyan
	'#f97316', // orange
];

const DEFAULT_PC_COLOR = '#94a3b8';

/** Does vertical segment (vx, vy1→vy2) cross horizontal (hy, hx1→hx2)? */
function vhCross(
	vx: number,
	vy1: number,
	vy2: number,
	hy: number,
	hx1: number,
	hx2: number,
): boolean {
	const [vyMin, vyMax] = vy1 < vy2 ? [vy1, vy2] : [vy2, vy1];
	const [hxMin, hxMax] = hx1 < hx2 ? [hx1, hx2] : [hx2, hx1];
	// strict inequalities so shared endpoints don't count
	return vx > hxMin && vx < hxMax && hy > vyMin && hy < vyMax;
}

/** Do two L-shaped parent-child edges cross? */
function pcEdgesCross(a: ParentChildEdge, b: ParentChildEdge): boolean {
	// A's vertical segments vs B's horizontal segment
	if (
		vhCross(a.junctionX, a.parentBottomY, a.midY, b.midY, b.junctionX, b.childX)
	)
		return true;
	if (vhCross(a.childX, a.midY, a.childTopY, b.midY, b.junctionX, b.childX))
		return true;
	// B's vertical segments vs A's horizontal segment
	if (
		vhCross(b.junctionX, b.parentBottomY, b.midY, a.midY, a.junctionX, a.childX)
	)
		return true;
	if (vhCross(b.childX, b.midY, b.childTopY, a.midY, a.junctionX, a.childX))
		return true;
	return false;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TreeCanvas({ onPersonOpen }: { onPersonOpen?: () => void }) {
	const { state, dispatch, centerPersonId } = useFamilyTree();
	const containerRef = useRef<HTMLDivElement>(null);

	/* ---- pan / zoom state ---- */
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
	const [wasDragged, setWasDragged] = useState(false);

	/* refs so the native wheel handler always sees latest values */
	const stateRef = useRef({ zoom, offset });
	stateRef.current = { zoom, offset };

	/* ---- layout ---- */

	const positions = useMemo(
		() => computeTreeLayout(state.people, centerPersonId),
		[state.people, centerPersonId],
	);

	const positionMap = useMemo(() => {
		const map = new Map<string, { x: number; y: number }>();
		for (const p of positions) {
			map.set(p.personId, { x: p.x, y: p.y });
		}
		return map;
	}, [positions]);

	/* ---- initialise offset to viewport centre & track resizes ---- */

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const centre = () => {
			const { width, height } = el.getBoundingClientRect();
			setOffset({ x: width / 2, y: height / 2 });
		};
		centre();

		const ro = new ResizeObserver(centre);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	/* ---- native wheel handler (non-passive so we can preventDefault) ---- */

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const { zoom: curZoom, offset: curOffset } = stateRef.current;

			const factor = e.deltaY < 0 ? 1.1 : 0.9;
			const newZoom = Math.min(3, Math.max(0.3, curZoom * factor));

			const rect = el.getBoundingClientRect();
			const mx = e.clientX - rect.left;
			const my = e.clientY - rect.top;

			setOffset({
				x: mx - ((mx - curOffset.x) / curZoom) * newZoom,
				y: my - ((my - curOffset.y) / curZoom) * newZoom,
			});
			setZoom(newZoom);
		};

		el.addEventListener('wheel', handleWheel, { passive: false });
		return () => el.removeEventListener('wheel', handleWheel);
	}, []);

	/* ---- mouse & touch handlers for panning ---- */

	function handlePointerDown(clientX: number, clientY: number) {
		setIsDragging(true);
		setWasDragged(false);
		setDragStart({ x: clientX, y: clientY });
		setDragStartOffset({ x: offset.x, y: offset.y });
	}

	function handlePointerMove(clientX: number, clientY: number) {
		if (!isDragging) return;
		const dx = clientX - dragStart.x;
		const dy = clientY - dragStart.y;
		if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setWasDragged(true);
		setOffset({ x: dragStartOffset.x + dx, y: dragStartOffset.y + dy });
	}

	function handlePointerUp() {
		setIsDragging(false);
	}

	function handleMouseDown(e: React.MouseEvent) {
		if (e.button !== 0) return;
		handlePointerDown(e.clientX, e.clientY);
	}

	function handleMouseMove(e: React.MouseEvent) {
		handlePointerMove(e.clientX, e.clientY);
	}

	function handleTouchStart(e: React.TouchEvent) {
		if (e.touches.length === 1) {
			handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleTouchMove(e: React.TouchEvent) {
		if (e.touches.length === 1) {
			// Prevent default scrolling behaviour only if dragging
			// To do this properly requires a ref with passive: false event listener,
			// but we can try just updating state here.
			handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
		}
	}

	function handleMouseUp() {
		handlePointerUp();
	}

	function handleBackgroundClick() {
		if (!wasDragged && state.selectedPersonId) {
			dispatch({ type: 'SELECT_PERSON', personId: null });
		}
	}

	function resetView() {
		if (containerRef.current) {
			const { width, height } = containerRef.current.getBoundingClientRect();
			setOffset({ x: width / 2, y: height / 2 });
			setZoom(1);
		}
	}

	/* ---- compute edges ---- */

	const edgeData = useMemo(() => {
		const result: EdgeData[] = [];
		const drawnSpouses = new Set<string>();

		for (const person of Object.values(state.people)) {
			/* spouse edges */
			if (
				person.spouseId &&
				positionMap.has(person.id) &&
				positionMap.has(person.spouseId)
			) {
				const key = [person.id, person.spouseId].sort().join('-');
				if (!drawnSpouses.has(key)) {
					drawnSpouses.add(key);
					const p1 = positionMap.get(person.id)!;
					const p2 = positionMap.get(person.spouseId)!;
					const leftX = Math.min(p1.x, p2.x) + NODE_W / 2;
					const rightX = Math.max(p1.x, p2.x) - NODE_W / 2;
					result.push({
						key,
						type: 'spouse',
						x1: leftX,
						y1: p1.y,
						x2: rightX,
						y2: p2.y,
					});
				}
			}

			/* parent-child edges */
			if (person.parentIds.length > 0 && positionMap.has(person.id)) {
				const childPos = positionMap.get(person.id)!;
				const parentPositions = person.parentIds
					.filter((pid) => positionMap.has(pid))
					.map((pid) => positionMap.get(pid)!);

				if (parentPositions.length > 0) {
					const junctionX =
						parentPositions.reduce((s, p) => s + p.x, 0) /
						parentPositions.length;
					const parentBottomY = parentPositions[0].y + NODE_H / 2;
					const childTopY = childPos.y - NODE_H / 2;
					const midY = (parentBottomY + childTopY) / 2;

					result.push({
						key: `pc-${person.id}`,
						type: 'parent-child',
						path: `M ${junctionX} ${parentBottomY} L ${junctionX} ${midY} L ${childPos.x} ${midY} L ${childPos.x} ${childTopY}`,
						junctionX,
						childX: childPos.x,
						parentBottomY,
						midY,
						childTopY,
						color: DEFAULT_PC_COLOR,
					});
				}
			}
		}

		/* ---- detect crossings & assign colours ---- */
		const pcEdges = result.filter(
			(e): e is ParentChildEdge => e.type === 'parent-child',
		);

		// Build adjacency list: which edges cross each other
		const adj = new Map<number, Set<number>>();
		for (let i = 0; i < pcEdges.length; i++) {
			for (let j = i + 1; j < pcEdges.length; j++) {
				if (pcEdgesCross(pcEdges[i], pcEdges[j])) {
					if (!adj.has(i)) adj.set(i, new Set());
					if (!adj.has(j)) adj.set(j, new Set());
					adj.get(i)!.add(j);
					adj.get(j)!.add(i);
				}
			}
		}

		// Greedy graph colouring for crossing edges
		const colorIdx = new Map<number, number>();
		for (const idx of adj.keys()) {
			const used = new Set<number>();
			for (const nb of adj.get(idx)!) {
				if (colorIdx.has(nb)) used.add(colorIdx.get(nb)!);
			}
			let c = 0;
			while (used.has(c)) c++;
			colorIdx.set(idx, c);
		}

		// Apply colours
		for (let i = 0; i < pcEdges.length; i++) {
			if (colorIdx.has(i)) {
				pcEdges[i].color =
					CROSSING_PALETTE[colorIdx.get(i)! % CROSSING_PALETTE.length];
			}
		}

		return result;
	}, [state.people, positionMap]);

	/* ---- dot-grid background ---- */
	const gridSize = 20 * zoom;

	/* ---- render ---- */
	return (
		<div
			ref={containerRef}
			className={`w-full h-full overflow-hidden relative select-none bg-gray-50 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
			style={{
				backgroundSize: `${gridSize}px ${gridSize}px`,
				backgroundPosition: `${offset.x}px ${offset.y}px`,
				backgroundImage:
					'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
			}}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handlePointerUp}
			onTouchCancel={handlePointerUp}
			onClick={handleBackgroundClick}
		>
			{/* Reset-to-me button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					resetView();
				}}
				className='absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors border border-gray-200'
			>
				↻ Reset
			</button>

			{/* Transformed world container */}
			<div
				style={{
					transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
					transformOrigin: '0 0',
					position: 'absolute',
					top: 0,
					left: 0,
				}}
			>
				{/* SVG edge layer */}
				<svg
					style={{
						position: 'absolute',
						overflow: 'visible',
						top: 0,
						left: 0,
						width: 1,
						height: 1,
					}}
				>
					{edgeData.map((edge) =>
						edge.type === 'spouse' ? (
							<line
								key={edge.key}
								x1={edge.x1}
								y1={edge.y1}
								x2={edge.x2}
								y2={edge.y2}
								stroke='#a5b4fc'
								strokeWidth={2}
								strokeDasharray='6 3'
							/>
						) : (
							<path
								key={edge.key}
								d={edge.path}
								fill='none'
								stroke={edge.color}
								strokeWidth={edge.color !== DEFAULT_PC_COLOR ? 2.5 : 2}
							/>
						),
					)}
				</svg>

				{/* Person nodes */}
				{positions.map((pos) => (
					<PersonNode
						key={pos.personId}
						person={state.people[pos.personId]}
						x={pos.x}
						y={pos.y}
						isCenter={pos.personId === centerPersonId}
						isSelected={pos.personId === state.selectedPersonId}
						onClick={() => {
							dispatch({ type: 'SELECT_PERSON', personId: pos.personId });
						}}
						onOpen={() => {
							dispatch({ type: 'SELECT_PERSON', personId: pos.personId });
							onPersonOpen?.();
						}}
					/>
				))}
			</div>
		</div>
	);
}
