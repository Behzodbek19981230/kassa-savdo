import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/Input';
import { Textarea } from './ui/textarea';
import { DatePicker } from './ui/DatePicker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { useCreateNote, useDeleteNote, useNotesAll, useUpdateNote } from '../hooks/api/useNotes';
import { getNotesWsUrl, type NoteItem } from '../services/note.service';
import clsx from 'clsx';

type WsNotePayload = {
	type?: string;
	action?: string;
	note?: NoteItem;
	id?: number;
	note_id?: number;
} & Partial<NoteItem>;

const shortDate = (rawDate?: string) => {
	if (!rawDate) return '—';
	const d = new Date(rawDate);
	if (Number.isNaN(d.getTime())) return '—';
	const day = String(d.getDate()).padStart(2, '0');
	const mon = String(d.getMonth() + 1).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const m = String(d.getMinutes()).padStart(2, '0');
	return `${day}.${mon} ${h}:${m}`;
};

const getDefaultReminderDate = () => {
	const date = new Date();
	date.setMinutes(date.getMinutes() + 5);
	return date;
};

const toTimeValue = (date: Date) => {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseReminder = (rawDate?: string) => {
	const fallback = getDefaultReminderDate();
	if (!rawDate) return { date: fallback, time: toTimeValue(fallback) };
	const date = new Date(rawDate);
	if (Number.isNaN(date.getTime())) return { date: fallback, time: toTimeValue(fallback) };
	return { date, time: toTimeValue(date) };
};

const toIsoFromDateAndTime = (date: Date, time: string) => {
	const [hourStr, minuteStr] = time.split(':');
	const hour = Number(hourStr);
	const minute = Number(minuteStr);
	const next = new Date(date);
	next.setHours(Number.isNaN(hour) ? 0 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0);
	return next.toISOString();
};

const isDueNow = (rawDate?: string) => {
	if (!rawDate) return false;
	const d = new Date(rawDate);
	return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
};

const upsertNote = (current: NoteItem[], note: NoteItem) => {
	const idx = current.findIndex((n) => n.id === note.id);
	if (idx === -1) return [note, ...current];
	const next = [...current];
	next[idx] = { ...next[idx], ...note };
	return next;
};

const statusDot: Record<string, string> = {
	done: 'bg-emerald-500',
	expired: 'bg-red-500',
	new: 'bg-amber-500',
};

const statusLabel: Record<string, string> = {
	done: 'Bajarilgan',
	expired: "Muddati o'tgan",
	new: 'Yangi',
};

interface NotesPanelProps {
	/** When true, hides the built-in header (used inside Sheet) */
	embedded?: boolean;
}

export function NotesPanel({ embedded = false }: NotesPanelProps) {
	const { data, isLoading } = useNotesAll();
	const createNote = useCreateNote();
	const updateNote = useUpdateNote();
	const deleteNote = useDeleteNote();
	const [notes, setNotes] = useState<NoteItem[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [viewingNote, setViewingNote] = useState<NoteItem | null>(null);
	const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
	const [title, setTitle] = useState('');
	const [text, setText] = useState('');
	const initialReminder = getDefaultReminderDate();
	const [reminderDate, setReminderDate] = useState<Date | undefined>(initialReminder);
	const [reminderTime, setReminderTime] = useState(toTimeValue(initialReminder));
	const reconnectRef = useRef<number | null>(null);

	useEffect(() => {
		if (data) setNotes(data);
	}, [data]);

	useEffect(() => {
		// Listen for messages dispatched by the global notes WS client
		const handler = (e: Event) => {
			const ce = e as CustomEvent;
			const payload = ce.detail as WsNotePayload | null;
			if (!payload) return;
			if (payload.type === 'note_event') {
				const id = (payload as any).note_id || payload.id;
				if (!id) return;
				const status = (payload as any).status as string | undefined;
				const titleFromPayload = (payload as any).note_title || (payload as any).title;
				const deadline = (payload as any).deadline as string | undefined;
				setNotes((prev) => {
					const idx = prev.findIndex((n) => n.id === id);
					if (idx === -1) {
						const item: NoteItem = {
							id,
							title: titleFromPayload || 'Sarlavha',
							status: status,
							date: deadline,
						};
						return [item, ...prev];
					}
					const next = [...prev];
					next[idx] = {
						...next[idx],
						status: status ?? next[idx].status,
						title: titleFromPayload ?? next[idx].title,
						date: deadline ?? next[idx].date,
					};
					return next;
				});
				return;
			}
			const action = payload.action || payload.type || (payload as any).event;
			const note = payload.note || (payload.id ? (payload as NoteItem) : null);
			if (action === 'delete' || action === 'deleted') {
				const removeId = payload.note_id || payload.id;
				if (removeId) setNotes((prev) => prev.filter((item) => item.id !== removeId));
				return;
			}
			if (note?.id) setNotes((prev) => upsertNote(prev, note));
		};
		window.addEventListener('notes:message', handler as EventListener);
		return () => window.removeEventListener('notes:message', handler as EventListener);
	}, []);

	const isMutating = createNote.isPending || updateNote.isPending || deleteNote.isPending;
	const unreadCount = useMemo(() => notes.filter((n) => n.is_read === false).length, [notes]);

	const sortedNotes = useMemo(() => {
		return [...notes];
	}, [notes]);

	const editingNote = useMemo(
		() => (editingNoteId ? notes.find((n) => n.id === editingNoteId) || null : null),
		[editingNoteId, notes],
	);

	const resetForm = () => {
		setEditingNoteId(null);
		setTitle('');
		setText('');
		const next = getDefaultReminderDate();
		setReminderDate(next);
		setReminderTime(toTimeValue(next));
	};

	const openCreate = () => {
		resetForm();
		setIsDialogOpen(true);
	};

	// minimum selectable date for creation: today (no past dates)
	const getTodayStart = () => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const openEdit = (note: NoteItem) => {
		const r = parseReminder(note.date);
		setEditingNoteId(note.id);
		setTitle(note.title || '');
		setText(note.text || '');
		setReminderDate(r.date);
		setReminderTime(r.time);
		setIsDialogOpen(true);
	};

	const onSave = async () => {
		const trimmedTitle = title.trim();
		if (!trimmedTitle || !reminderDate || !reminderTime) return;
		const payload = {
			date: toIsoFromDateAndTime(reminderDate, reminderTime),
			title: trimmedTitle,
			text: text.trim(),
			sorting: 0,
			status: editingNote?.status || 'new',
			is_delete: false,
		};
		if (editingNoteId) {
			await updateNote.mutateAsync({ id: editingNoteId, payload });
		} else {
			await createNote.mutateAsync(payload);
		}
		setIsDialogOpen(false);
		resetForm();
	};

	const onDelete = async (noteId: number) => {
		if (!window.confirm("Eslatmani o'chirishni tasdiqlaysizmi?")) return;
		await deleteNote.mutateAsync(noteId);
	};

	const onDone = async (note: NoteItem) => {
		await updateNote.mutateAsync({
			id: note.id,
			payload: {
				sorting: note.sorting ?? 0,
				date: note.date || new Date().toISOString(),
				title: note.title,
				text: note.text || '',
				status: 'done',
				is_delete: note.is_delete ?? false,
			},
		});
	};

	const openView = async (note: NoteItem) => {
		setViewingNote(note);
		setIsViewDialogOpen(true);

		// Agar eslatma o'qilmagan bo'lsa, uni o'qilgan deb belgilash
		if (note.is_read === false) {
			try {
				await updateNote.mutateAsync({
					id: note.id,
					payload: {
						sorting: note.sorting ?? 0,
						date: note.date || new Date().toISOString(),
						title: note.title,
						text: note.text || '',
						status: note.status || 'new',
						is_read: true,
						is_delete: note.is_delete ?? false,
					},
				});
			} catch (error) {
				console.error('Failed to mark note as read:', error);
			}
		}
	};

	// Listen for external requests to open a specific note (from header dropdown)
	useEffect(() => {
		const handler = (e: Event) => {
			const ce = e as CustomEvent;
			const id = ce?.detail?.id as number | undefined;
			if (!id) return;
			const note = notes.find((n) => n.id === id) || data?.find((n) => n.id === id) || null;
			if (note) void openView(note);
		};
		window.addEventListener('open-note', handler as EventListener);
		return () => window.removeEventListener('open-note', handler as EventListener);
	}, [notes, data, openView]);

	return (
		<div className={embedded ? 'flex flex-col h-full' : 'rounded-xl border border-gray-200 bg-white shadow-sm'}>
			{/* Header — faqat embedded bo'lmaganda ko'rsatiladi */}
			{!embedded && (
				<div className='flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5'>
					<div className='flex items-center gap-2'>
						<h3 className='text-sm font-semibold text-gray-900'>Eslatmalar</h3>
						{unreadCount > 0 && (
							<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700'>
								{unreadCount}
							</span>
						)}
					</div>
					<Button size='sm' variant='ghost' className='h-7 gap-1 px-2 text-xs' onClick={openCreate}>
						<Plus className='h-3.5 w-3.5' />
						Qo'shish
					</Button>
				</div>
			)}

			{/* Embedded rejimda qo'shish tugmasi va o'qilmagan badge */}
			{embedded && (
				<div className='flex items-center justify-between gap-2 px-4 py-2'>
					{unreadCount > 0 && (
						<span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700'>
							{unreadCount} ta o'qilmagan
						</span>
					)}
					<Button size='sm' variant='ghost' className='h-7 gap-1 px-2 text-xs ml-auto' onClick={openCreate}>
						<Plus className='h-3.5 w-3.5' />
						Qo'shish
					</Button>
				</div>
			)}

			{/* List */}
			<div className={embedded ? 'flex-1 overflow-y-auto' : 'max-h-[320px] overflow-y-auto'}>
				{isLoading ? (
					<p className='px-4 py-6 text-center text-xs text-gray-500'>Yuklanmoqda...</p>
				) : sortedNotes.length === 0 ? (
					<p className='px-4 py-6 text-center text-xs text-gray-500'>Eslatma mavjud emas</p>
				) : (
					<div className='divide-y divide-gray-200'>
						{sortedNotes.map((note) => {
							const st = note.status || 'new';
							const canDone = st !== 'done';
							return (
								<div
									key={note.id}
									className={clsx(
										`group flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-gray-50 cursor-pointer  `,
										{
											'bg-amber-100': canDone && note.is_read,
											'bg-blue-50': note.is_read === false,
											'bg-red-50': isDueNow(note.date) && st === 'expired',
											'bg-amber-50': isDueNow(note.date) && st === 'new',
											'bg-green-50':
												st === 'new' &&
												note.date &&
												new Date(note.date).getTime() - Date.now() > 86400000,
										},
									)}
									onClick={() => openView(note)}
								>
									{/* Holati nuqtasi */}
									<span
										className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ring-2 ring-white ${
											st === 'new' &&
											note.date &&
											new Date(note.date).getTime() - Date.now() > 86400000
												? 'bg-green-500'
												: statusDot[st] || statusDot.new
										}`}
										title={statusLabel[st] || 'Yangi'}
									/>

									{/* Content */}
									<div className='min-w-0 flex-1'>
										<div className='flex items-center gap-1.5'>
											<span className='truncate text-[13px] font-medium text-gray-900'>
												{note.title || 'Sarlavha'}
											</span>
											{note.is_read === false && (
												<span className='flex-shrink-0 rounded bg-blue-500/15 px-1 py-px text-[9px] font-semibold text-blue-600'>
													yangi
												</span>
											)}
										</div>
										<div className='flex items-center gap-2 text-[11px] text-gray-500'>
											<span className='inline-flex items-center gap-1'>
												<Clock className='h-3 w-3' />
												{shortDate(note.date || note.created_at)}
											</span>
											{note.created_by_detail?.full_name && (
												<>
													<span>·</span>
													<span className='truncate'>{note.created_by_detail.full_name}</span>
												</>
											)}
											{note.text && (
												<>
													<span>·</span>
													<span className='truncate max-w-[120px]'>{note.text}</span>
												</>
											)}
										</div>
									</div>

									{/* Amallar — hover paytida ko'rinadi */}
									<div
										className='flex flex-shrink-0 items-center gap-0.5 transition-opacity opacity-100'
										onClick={(e) => e.stopPropagation()}
									>
										{canDone && (
											<Button
												size='icon'
												variant='ghost'
												className='h-6 w-6 text-emerald-600 hover:text-emerald-700'
												title='Bajarildi'
												onClick={() => onDone(note)}
											>
												<Check className='h-3.5 w-3.5' />
											</Button>
										)}
										<Button
											size='icon'
											variant='ghost'
											className='h-6 w-6'
											title='Tahrirlash'
											onClick={() => openEdit(note)}
										>
											<Pencil className='h-3 w-3' />
										</Button>
										<Button
											size='icon'
											variant='ghost'
											className='h-6 w-6 text-red-600 hover:text-red-700'
											title="O'chirish"
											onClick={() => onDelete(note.id)}
										>
											<Trash2 className='h-3 w-3' />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* View Dialog - To'liq ko'rsatish */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='text-base'>{viewingNote?.title || 'Sarlavha'}</DialogTitle>
					</DialogHeader>
					<div className='space-y-4 py-2'>
						<div className='flex items-center gap-2 text-sm text-gray-500'>
							<Clock className='h-4 w-4' />
							<span>{shortDate(viewingNote?.date || viewingNote?.created_at)}</span>
							{viewingNote?.created_by_detail?.full_name && (
								<>
									<span>·</span>
									<span>{viewingNote.created_by_detail.full_name}</span>
								</>
							)}
							{viewingNote?.status && (
								<>
									<span>·</span>
									<span
										className={`px-2 py-0.5 rounded-full text-xs font-medium ${
											viewingNote.status === 'done'
												? 'bg-emerald-500/15 text-emerald-700'
												: viewingNote.status === 'expired'
													? 'bg-red-500/15 text-red-700'
													: 'bg-amber-500/15 text-amber-700'
										}`}
									>
										{statusLabel[viewingNote.status] || 'Yangi'}
									</span>
								</>
							)}
						</div>
						{viewingNote?.text && (
							<div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
								<p className='text-sm whitespace-pre-wrap break-words'>{viewingNote.text}</p>
							</div>
						)}
						{!viewingNote?.text && <p className='text-sm text-gray-500 italic'>Izoh mavjud emas</p>}
					</div>
					<DialogFooter>
						{viewingNote && viewingNote.status !== 'done' && (
							<Button
								size='sm'
								variant='outline'
								className='text-emerald-600 border-emerald-300 hover:bg-emerald-50'
								onClick={() => {
									onDone(viewingNote);
									setIsViewDialogOpen(false);
								}}
							>
								<Check className='h-3.5 w-3.5 mr-1.5' />
								Bajarildi
							</Button>
						)}
						<Button size='sm' variant='outline' onClick={() => setIsViewDialogOpen(false)}>
							Yopish
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit/Create Dialog */}
			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) resetForm();
				}}
			>
				<DialogContent className='sm:max-w-[460px]'>
					<DialogHeader>
						<DialogTitle className='text-base'>
							{editingNoteId ? 'Eslatmani tahrirlash' : "Yangi eslatma qo'shish"}
						</DialogTitle>
					</DialogHeader>
					<div className='grid gap-3 py-1'>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='Sarlavha'
							className='h-9 text-sm'
						/>
						<div className='flex gap-2'>
							<DatePicker
								date={reminderDate}
								onDateChange={setReminderDate}
								placeholder='Sana'
								disabled={editingNoteId ? undefined : { before: getTodayStart() }}
							/>
							<Input
								type='time'
								value={reminderTime}
								onChange={(e) => setReminderTime(e.target.value)}
								className='h-9 w-[110px] text-sm'
							/>
						</div>
						<Textarea
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder='Izoh'
							rows={3}
							className='text-sm'
						/>
					</div>
					<DialogFooter>
						<Button size='sm' variant='outline' onClick={() => setIsDialogOpen(false)}>
							Bekor qilish
						</Button>
						<Button
							size='sm'
							onClick={onSave}
							disabled={isMutating || !title.trim() || !reminderDate || !reminderTime}
						>
							Saqlash
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
