import { useState } from 'react';
import {
	Calendar,
	Clock,
	Heart,
	MoreVertical,
	MapPin,
	FileText,
	Edit,
	UserPlus,
	Trash2,
	Link as LinkIcon,
} from 'lucide-react';
import { useFamilyTree } from '../../state/family-tree-context';
import { getAvatarUrl } from '../../utils/avatar';
import { getRelationship } from '../../utils/relationship';
import { canEdit } from '../../state/permissions';
import * as api from '../../services/api-client';

export const ProfileScreen = () => {
	const { state, dispatch, currentUser, refreshTree } = useFamilyTree();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const personId = state.selectedPersonId || state.currentUser?.personId || '';
	const person = state.people[personId];

	if (!person) return null;

	const calculateAge = () => {
		if (person.birthDate) {
			const bd = new Date(person.birthDate);
			if (!isNaN(bd.getTime()))
				return new Date().getFullYear() - bd.getFullYear();
		}
		if (person.birthYear) return new Date().getFullYear() - person.birthYear;
		return 'Unknown';
	};
	const age = calculateAge();

	const relationshipText = currentUser
		? getRelationship(currentUser.personId, person.id, state.people)
		: 'Relative';

	const isEditable = currentUser
		? canEdit(currentUser, person.id, state.people)
		: false;

	const formatBirthDate = (dateString?: string | null) => {
		if (!dateString) return 'Unknown';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return dateString;
			return date.toLocaleDateString(undefined, {
				month: 'long',
				day: 'numeric',
			});
		} catch {
			return dateString;
		}
	};

	async function handleDelete() {
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}
		setDeleting(true);
		try {
			await api.deletePerson(person.id);
			dispatch({ type: 'SELECT_PERSON', personId: null });
			await refreshTree();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to delete');
		} finally {
			setDeleting(false);
			setConfirmDelete(false);
		}
	}

	return (
		<div className='flex h-full w-full flex-col bg-gray-50'>
			{/* Header */}
			<div className='flex items-center justify-between px-6 py-4 mt-safe'>
				<button className='rounded-full bg-white p-2 shadow-sm opacity-0 pointer-events-none'>
					<MoreVertical size={20} />
				</button>
				<button
					className='rounded-full bg-white p-2 shadow-sm'
					onClick={() => dispatch({ type: 'SELECT_PERSON', personId: null })}
				>
					<MoreVertical size={20} className='text-gray-600' />
				</button>
			</div>

			{/* Profile Info */}
			<div className='mt-2 flex flex-col items-center px-4 text-center'>
				<div
					className={`relative mb-4 h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg ${person.isDeceased ? 'grayscale opacity-80' : ''}`}
				>
					<img
						src={getAvatarUrl(person)}
						alt={person.firstName}
						className='h-full w-full object-cover'
					/>
				</div>
				<h1 className='text-2xl font-bold text-gray-800 flex items-center justify-center gap-2 flex-wrap'>
					{person.firstName} {person.lastName}
					{person.isDeceased && (
						<span className='rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white uppercase ml-1'>
							Late
						</span>
					)}
				</h1>
				<p className='mt-1 text-sm font-semibold text-lime-600 uppercase tracking-widest'>
					{relationshipText}
				</p>
			</div>

			{/* Actions - Edit */}
			{isEditable && (
				<div className='mt-6 px-6 flex justify-center'>
					<button
						onClick={() =>
							dispatch({ type: 'SET_EDITING', personId: person.id })
						}
						className='flex items-center space-x-2 rounded-full bg-lime-500 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-lime-600'
					>
						<Edit size={16} />
						<span>Edit Profile</span>
					</button>
				</div>
			)}

			{/* Details Section */}
			<div className='mt-8 flex-1 overflow-y-auto px-6 pb-24 space-y-6'>
				{/* Basic Info */}
				<div className='space-y-4 rounded-3xl bg-white p-6 shadow-sm border border-gray-100'>
					{person.bio && (
						<div className='pb-4 border-b border-gray-100'>
							<span className='flex items-center text-sm font-medium text-gray-600 mb-2'>
								<FileText className='mr-2 text-lime-500' size={18} />
								Biography
							</span>
							<p className='text-sm text-gray-500 leading-relaxed whitespace-pre-wrap'>
								{person.bio}
							</p>
						</div>
					)}

					<div className='flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0'>
						<span className='flex items-center text-sm font-medium text-gray-600'>
							<MapPin className='mr-3 text-lime-500' size={18} />
							Living in:
						</span>
						<span className='text-sm text-gray-500 text-right'>
							{person.location || 'Unknown'}
						</span>
					</div>

					<div className='flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0'>
						<span className='flex items-center text-sm font-medium text-gray-600'>
							<Calendar className='mr-3 text-lime-500' size={18} />
							Birthday:
						</span>
						<span className='text-sm text-gray-500 text-right'>
							{formatBirthDate(person.birthDate)}
						</span>
					</div>

					{person.isDeceased && person.deathYear && (
						<div className='flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0'>
							<span className='flex items-center text-sm font-medium text-gray-600'>
								<Heart className='mr-3 text-gray-400' size={18} />
								Death Year:
							</span>
							<span className='text-sm text-gray-500 text-right'>
								{person.deathYear}
							</span>
						</div>
					)}

					{age !== 'Unknown' && !person.isDeceased && (
						<div className='flex items-center justify-between pt-1'>
							<span className='flex items-center text-sm font-medium text-gray-600'>
								<Clock className='mr-3 text-lime-500' size={18} />
								Age:
							</span>
							<span className='text-sm text-gray-500'>{age} Years</span>
						</div>
					)}
				</div>

				{/* Admin Controls for Relations */}
				{state.isAdminMode && currentUser?.role === 'admin' && (
					<div className='space-y-3 rounded-3xl bg-white p-6 shadow-sm border border-amber-100'>
						<h3 className='text-sm font-bold text-amber-600 mb-4 uppercase tracking-wider'>
							Admin Utilities (Relations)
						</h3>

						<div className='grid grid-cols-2 gap-3'>
							{person.parentIds.length < 2 && (
								<button
									onClick={() =>
										dispatch({
											type: 'OPEN_ADD_PERSON_MODAL',
											relativePersonId: person.id,
											relationType: 'parent',
										})
									}
									className='flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
								>
									<UserPlus size={14} className='text-gray-500' /> Add Parent
								</button>
							)}

							{!person.spouseId && (
								<button
									onClick={() =>
										dispatch({
											type: 'OPEN_ADD_PERSON_MODAL',
											relativePersonId: person.id,
											relationType: 'spouse',
										})
									}
									className='flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
								>
									<UserPlus size={14} className='text-gray-500' /> Add Spouse
								</button>
							)}

							<button
								onClick={() =>
									dispatch({
										type: 'OPEN_ADD_PERSON_MODAL',
										relativePersonId: person.id,
										relationType: 'child',
									})
								}
								className='flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
							>
								<UserPlus size={14} className='text-gray-500' /> Add Child
							</button>

							{person.parentIds.length > 0 && (
								<button
									onClick={() =>
										dispatch({
											type: 'OPEN_ADD_PERSON_MODAL',
											relativePersonId: person.id,
											relationType: 'sibling',
										})
									}
									className='flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
								>
									<UserPlus size={14} className='text-gray-500' /> Add Sibling
								</button>
							)}
						</div>

						<button
							onClick={() =>
								dispatch({
									type: 'OPEN_MANAGE_RELATIONSHIPS_MODAL',
									personId: person.id,
								})
							}
							className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-50 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
						>
							<LinkIcon size={16} /> Manage Relations & Arrows
						</button>

						<div className='pt-5 mt-2 border-t border-gray-100'>
							{confirmDelete ? (
								<div className='flex flex-col space-y-3'>
									<p className='text-xs text-red-600 text-center font-medium'>
										Delete {person.firstName}? This cannot be undone.
									</p>
									<div className='flex gap-2'>
										<button
											onClick={() => setConfirmDelete(false)}
											className='flex-1 rounded-xl bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'
										>
											Cancel
										</button>
										<button
											onClick={handleDelete}
											disabled={deleting}
											className='flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-red-600'
										>
											{deleting ? 'Deleting…' : 'Confirm'}
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => setConfirmDelete(true)}
									className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 py-3 text-sm font-medium hover:bg-red-100 border border-red-100'
								>
									<Trash2 size={16} /> Delete Person
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
