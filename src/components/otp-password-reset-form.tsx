import { useMemo, useState } from 'react';
import {
	requestForgotPasswordOtp,
	resetPasswordWithOtp,
} from '../services/api-client';
import { PhoneNumberField } from './phone-number-field';

export function OtpPasswordResetForm({
	title,
	description,
	defaultUsername = '',
	defaultPhoneNumber = '',
	hideUsername = false,
	onSuccess,
	submitLabel = 'Reset Password',
}: {
	title: string;
	description: string;
	defaultUsername?: string;
	defaultPhoneNumber?: string;
	hideUsername?: boolean;
	onSuccess: () => void;
	submitLabel?: string;
}) {
	const [username, setUsername] = useState(defaultUsername);
	const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber);
	const [otp, setOtp] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const passwordsMatch = newPassword === confirmPassword;
	const canRequestOtp = username.trim() && phoneNumber.trim();
	const canSubmit =
		Boolean(username.trim()) &&
		Boolean(phoneNumber.trim()) &&
		Boolean(otp.trim()) &&
		newPassword.trim().length >= 6 &&
		passwordsMatch &&
		!loading;

	const subtitle = useMemo(() => {
		if (!otpSent) return description;
		return 'Enter the OTP you received and choose a new password.';
	}, [description, otpSent]);

	async function handleRequestOtp() {
		if (!canRequestOtp) return;
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			await requestForgotPasswordOtp(username.trim(), phoneNumber.trim());
			setOtpSent(true);
			setSuccess('OTP sent. For now, any OTP will be accepted.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send OTP');
		} finally {
			setLoading(false);
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			await resetPasswordWithOtp({
				username: username.trim(),
				phoneNumber: phoneNumber.trim(),
				otp: otp.trim(),
				newPassword,
			});
			setSuccess('Password reset successfully.');
			setTimeout(onSuccess, 900);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reset password');
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<div>
				<h2 className='text-xl font-bold text-gray-800'>{title}</h2>
				<p className='mt-1 text-sm text-gray-500'>{subtitle}</p>
			</div>

			{error && (
				<div className='rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600'>
					{error}
				</div>
			)}
			{success && (
				<div className='rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700'>
					{success}
				</div>
			)}

			{!hideUsername && (
				<div>
					<label className='mb-1 block text-sm font-medium text-gray-600'>
						Username
					</label>
					<input
						type='text'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder='Enter username'
						className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
					/>
				</div>
			)}

			{hideUsername && <input type='hidden' value={username} readOnly />}

			<div>
				<label className='mb-1 block text-sm font-medium text-gray-600'>
					Phone Number
				</label>
				<PhoneNumberField value={phoneNumber} onChange={setPhoneNumber} />
			</div>

			<div className='rounded-xl bg-gray-50 p-3'>
				<button
					type='button'
					onClick={handleRequestOtp}
					disabled={!canRequestOtp || loading}
					className='w-full rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50'
				>
					{loading && !otpSent
						? 'Sending…'
						: otpSent
							? 'Resend OTP'
							: 'Send OTP'}
				</button>
			</div>

			{otpSent && (
				<>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-600'>
							OTP
						</label>
						<input
							type='text'
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							placeholder='Enter OTP'
							className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm tracking-[0.3em] focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-gray-600'>
							New Password
						</label>
						<input
							type='password'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder='At least 6 characters'
							className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
						/>
					</div>

					<div>
						<label className='mb-1 block text-sm font-medium text-gray-600'>
							Confirm Password
						</label>
						<input
							type='password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder='Re-enter new password'
							className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
						/>
						{confirmPassword && !passwordsMatch && (
							<p className='mt-1 text-xs text-red-500'>
								Passwords do not match.
							</p>
						)}
					</div>

					<button
						type='submit'
						disabled={!canSubmit}
						className='w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{loading ? 'Updating…' : submitLabel}
					</button>
				</>
			)}
		</form>
	);
}
