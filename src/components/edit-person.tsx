import { useState } from 'react';
import { useFamilyTree } from '../state/family-tree-context';
import type { Gender } from '../types';
import * as api from '../services/api-client';

export function EditPerson() {
	const { state, dispatch, refreshTree } = useFamilyTree();

	const person = state.editingPersonId
		? state.people[state.editingPersonId]
		: null;

	const [firstName, setFirstName] = useState(person?.firstName ?? '');
	const [lastName, setLastName] = useState(person?.lastName ?? '');
	const [gender, setGender] = useState<Gender>(person?.gender ?? 'male');
	const [isDeceased, setIsDeceased] = useState(person?.isDeceased ?? false);
	const [bio, setBio] = useState(person?.bio ?? '');
	const [location, setLocation] = useState(person?.location ?? '');
	const [birthDate, setBirthDate] = useState(person?.birthDate ?? '');
	const [deathYear, setDeathYear] = useState(
		person?.deathYear?.toString() ?? '',
	);
	const [addParentId, setAddParentId] = useState('');
	const [addSpouseId, setAddSpouseId] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	if (!person) return null;

	async function handleAddParent() {
		if (!person || !addParentId) return;
		setError('');
		try {
			await api.addRelationship({
				sourcePersonId: addParentId,
				targetPersonId: person.id,
				relationshipType: 'PARENT',
			});
			setAddParentId('');
			await refreshTree();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to add parent');
		}
	}

	async function handleRemoveParent(parentId: string) {
		if (!person) return;
		setError('');
		try {
			// Find the relationship where parent -> person with type PARENT
			const rels = await api.getRelationshipsForPerson(parentId);
			const rel = rels.find(
				(r) =>
					r.target_person_id === person.id && r.relationship_type === 'PARENT',
			);
			if (rel) {
				await api.removeRelationship(rel.id);
			}
			await refreshTree();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to remove parent');
		}
	}

	async function handleAddSpouse() {
		if (!person || !addSpouseId) return;
		setError('');
		try {
			await api.addRelationship({
				sourcePersonId: person.id,
				targetPersonId: addSpouseId,
				relationshipType: 'SPOUSE',
			});
			setAddSpouseId('');
			await refreshTree();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to add spouse');
		}
	}

	async function handleRemoveSpouse(spouseIdToRemove: string) {
		if (!person) return;
		setError('');
		try {
			const rels = await api.getRelationshipsForPerson(person.id);
			const rel = rels.find(
				(r) =>
					r.target_person_id === spouseIdToRemove &&
					r.relationship_type === 'SPOUSE',
			);
			if (rel) {
				await api.removeRelationship(rel.id);
			}
			await refreshTree();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to remove spouse');
		}
	}

	async function handleSave() {
		if (!person) return;
		setSaving(true);
		setError('');

		try {
			await api.updatePerson(person.id, {
				firstName,
				lastName,
				gender,
				isDeceased,
				bio: bio || undefined,
				location: location || undefined,
				birthDate: birthDate || undefined,
			});
			dispatch({ type: 'SET_EDITING', personId: null });
			await refreshTree();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update person');
		} finally {
			setSaving(false);
		}
	}

	function handleCancel() {
		dispatch({ type: 'SET_EDITING', personId: null });
	}

	return (
		<div className='flex h-full w-full flex-col bg-gray-50'>
			{/* Fixed header */}
			<div className='flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4'>
				<button
					onClick={handleCancel}
					className='rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200'
				>
					← Back
				</button>
				<h2 className='text-lg font-bold text-gray-800'>Edit Person</h2>
				<button
					onClick={handleSave}
					disabled={saving}
					className='rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-lime-200 transition-colors hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>

			{/* Scrollable form body */}
			<div className='flex-1 overflow-y-auto overscroll-contain px-5 py-6'>
				<div className='mx-auto max-w-lg space-y-5'>
					{error && (
						<div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600'>
							{error}
						</div>
					)}

					{/* Names — 2-col */}
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
								First Name
							</label>
							<input
								type='text'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
							/>
						</div>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
								Last Name
							</label>
							<input
								type='text'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
							/>
						</div>
					</div>

					{/* Gender — visual toggle */}
					<div>
						<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
							Gender
						</label>
						<div className='flex gap-2'>
							{(['male', 'female', 'other'] as Gender[]).map((g) => {
								const emoji = g === 'male' ? '♂' : g === 'female' ? '♀' : '⚧';
								const label = g.charAt(0).toUpperCase() + g.slice(1);
								return (
									<button
										key={g}
										type='button'
										onClick={() => setGender(g)}
										className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
											gender === g
												? 'border-lime-500 bg-lime-50 text-lime-700 shadow-sm'
												: 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
										}`}
									>
										<span className='block text-xl leading-none'>{emoji}</span>
										<span className='text-[11px]'>{label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Bio */}
					<div>
						<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
							Biography
						</label>
						<textarea
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
							rows={3}
							placeholder='Short bio…'
						/>
					</div>

					{/* Location + Birth Date — 2-col */}
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
								Location
							</label>
							<input
								type='text'
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
								placeholder='City, Country'
							/>
						</div>
						<div>
							<label className='mb-1.5 block text-sm font-semibold text-gray-700'>
								Birth Date
							</label>
							<input
								type='date'
								value={birthDate ? birthDate.substring(0, 10) : ''}
								onChange={(e) => setBirthDate(e.target.value)}
								className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
							/>
						</div>
					</div>

					{/* Deceased */}
					<div className='flex flex-wrap items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm'>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								id='isDeceased'
								checked={isDeceased}
								onChange={(e) => setIsDeceased(e.target.checked)}
								className='h-5 w-5 cursor-pointer rounded border-gray-300 text-lime-600 focus:ring-2 focus:ring-lime-500'
							/>
							<label
								htmlFor='isDeceased'
								className='cursor-pointer text-sm font-semibold text-gray-700'
							>
								Deceased
							</label>
						</div>
						{isDeceased && (
							<div className='flex items-center gap-2'>
								<label className='text-sm font-medium text-gray-600'>
									Death Year:
								</label>
								<input
									type='number'
									value={deathYear}
									onChange={(e) => setDeathYear(e.target.value)}
									className='w-24 rounded-lg border border-transparent bg-gray-50 px-3 py-1.5 text-sm focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
									placeholder='YYYY'
								/>
							</div>
						)}
					</div>

					{/* Parents */}
					<div className='rounded-xl bg-white p-4 shadow-sm'>
						<h3 className='mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide'>
							Parents
						</h3>
						<div className='space-y-2'>
							{person.parentIds.map((pid) => {
								const parent = state.people[pid];
								return (
									<div
										key={pid}
										className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'
									>
										<span className='text-sm text-gray-700'>
											{parent ? `${parent.firstName} ${parent.lastName}` : pid}
										</span>
										<button
											type='button'
											onClick={() => handleRemoveParent(pid)}
											className='text-xs font-medium text-red-400 hover:text-red-600'
										>
											✕ Remove
										</button>
									</div>
								);
							})}
							{person.parentIds.length === 0 && (
								<p className='text-sm text-gray-400'>No parents</p>
							)}
							{person.parentIds.length < 2 && (
								<div className='mt-1 flex gap-2'>
									<select
										value={addParentId}
										onChange={(e) => setAddParentId(e.target.value)}
										className='flex-1 appearance-none rounded-xl border border-transparent bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
									>
										<option value=''>Add a parent…</option>
										{Object.values(state.people)
											.filter(
												(p) =>
													p.id !== person.id &&
													!person.parentIds.includes(p.id),
											)
											.map((p) => (
												<option key={p.id} value={p.id}>
													{p.firstName} {p.lastName}
												</option>
											))}
									</select>
									<button
										type='button'
										onClick={handleAddParent}
										disabled={!addParentId}
										className='rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-lime-200 hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50'
									>
										+ Add
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Spouses */}
					<div className='rounded-xl bg-white p-4 shadow-sm'>
						<h3 className='mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide'>
							Spouses
						</h3>
						<div className='space-y-2'>
							{person.spouseIds.map((sid) => {
								const spouse = state.people[sid];
								return (
									<div
										key={sid}
										className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'
									>
										<span className='text-sm text-gray-700'>
											{spouse ? `${spouse.firstName} ${spouse.lastName}` : sid}
										</span>
										<button
											type='button'
											onClick={() => handleRemoveSpouse(sid)}
											className='text-xs font-medium text-red-400 hover:text-red-600'
										>
											✕ Remove
										</button>
									</div>
								);
							})}
							{person.spouseIds.length === 0 && (
								<p className='text-sm text-gray-400'>No spouses</p>
							)}
							<div className='mt-1 flex gap-2'>
								<select
									value={addSpouseId}
									onChange={(e) => setAddSpouseId(e.target.value)}
									className='flex-1 appearance-none rounded-xl border border-transparent bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
								>
									<option value=''>Add a spouse…</option>
									{Object.values(state.people)
										.filter(
											(p) =>
												p.id !== person.id && !person.spouseIds.includes(p.id),
										)
										.map((p) => (
											<option key={p.id} value={p.id}>
												{p.firstName} {p.lastName}
											</option>
										))}
								</select>
								<button
									type='button'
									onClick={handleAddSpouse}
									disabled={!addSpouseId}
									className='rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-lime-200 hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50'
								>
									+ Add
								</button>
							</div>
						</div>
					</div>

					{/* Children (read-only) */}
					{person.childrenIds.length > 0 && (
						<div className='rounded-xl bg-white p-4 shadow-sm'>
							<h3 className='mb-3 text-sm font-bold text-gray-500 uppercase tracking-wide'>
								Children
							</h3>
							<p className='text-sm text-gray-600'>
								{person.childrenIds
									.map((id) => state.people[id]?.firstName ?? id)
									.join(', ')}
							</p>
						</div>
					)}

					{/* Bottom spacer so content doesn't hide behind safe area */}
					<div className='h-8' />
				</div>
			</div>
		</div>
	);
}
