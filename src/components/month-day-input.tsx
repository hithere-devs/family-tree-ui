import { useEffect, useMemo, useState } from 'react';
import {
	buildMonthDay,
	getDaysInMonth,
	MONTH_OPTIONS,
	parseMonthDay,
} from '../utils/birthdate';

export function MonthDayInput({
	value,
	onChange,
	className = '',
}: {
	value?: string | null;
	onChange: (value?: string) => void;
	className?: string;
}) {
	const initial = useMemo(() => parseMonthDay(value), [value]);
	const [month, setMonth] = useState(initial.month);
	const [day, setDay] = useState(initial.day);

	useEffect(() => {
		setMonth(initial.month);
		setDay(initial.day);
	}, [initial.day, initial.month]);

	const days = Array.from(
		{ length: getDaysInMonth(month || '01') },
		(_, index) => String(index + 1).padStart(2, '0'),
	);

	useEffect(() => {
		if (day && Number(day) > days.length) {
			const nextDay = String(days.length).padStart(2, '0');
			setDay(nextDay);
			onChange(buildMonthDay(month, nextDay));
		}
	}, [day, days.length, month, onChange]);

	return (
		<div className={`grid grid-cols-2 gap-2 ${className}`.trim()}>
			<select
				value={month}
				onChange={(e) => {
					const nextMonth = e.target.value;
					setMonth(nextMonth);
					onChange(buildMonthDay(nextMonth, day));
				}}
				className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
			>
				<option value=''>Month</option>
				{MONTH_OPTIONS.map((label, index) => {
					const monthValue = String(index + 1).padStart(2, '0');
					return (
						<option key={monthValue} value={monthValue}>
							{label}
						</option>
					);
				})}
			</select>
			<select
				value={day}
				onChange={(e) => {
					const nextDay = e.target.value;
					setDay(nextDay);
					onChange(buildMonthDay(month, nextDay));
				}}
				className='w-full rounded-xl border border-transparent bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-200'
			>
				<option value=''>Day</option>
				{days.map((dayValue) => (
					<option key={dayValue} value={dayValue}>
						{Number(dayValue)}
					</option>
				))}
			</select>
		</div>
	);
}
