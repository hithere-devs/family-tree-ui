import { useState } from 'react';
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
	const [otpVerified, setOtpVerified] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const passwordsMatch = newPassword === confirmPassword;
	const canSendOtp =
		Boolean(username.trim()) && Boolean(phoneNumber.trim()) && !loading;
	const canVerifyOtp = otp.trim().length >= 4 && !loading;
	const canSubmit =
		otpVerified && newPassword.trim().length >= 6 && passwordsMatch && !loading;

	async function handleSendOtp() {
		setLoading(true);
		setError('');
		setSuccess('');
		try {
			await requestForgotPasswordOtp(username.trim(), phoneNumber.trim());
			setOtpSent(true);
			setSuccess('OTP sent to your registered phone number.');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send OTP');
		} finally {
			setLoading(false);
		}
	}

	function handleVerifyOtp() {
		if (otp.trim().length < 4) {
			setError('Please enter the OTP you received.');
			return;
		}
		setError('');
		setOtpVerified(true);
		setSuccess('OTP accepted — now choose a new password.');
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
				<p className='mt-1 text-sm text-gray-500'>
					{otpVerified
						? 'OTP verified — now choose a new password.'
						: otpSent
							? 'Enter the OTP sent to your phone.'
							: description}
				</p>
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

			{/* Step 1: Username + Phone */}
			{!otpSent && (
				<>
					{!hideUsername && (
						<div>
							<label className='mb-1 block text-sm font-medium text-gray-600'>
								Username
							</label>
							<input
								type='text'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder='Enter your username'
								className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
							/>
						</div>
					)}

					{hideUsername && <input type='hidden' value={username} readOnly />}

					<div>
						<label className='mb-1 block text-sm font-medium text-gray-600'>
							Registered Phone Number
						</label>
						<PhoneNumberField value={phoneNumber} onChange={setPhoneNumber} />
					</div>

					<button
						type='button'
						onClick={handleSendOtp}
						disabled={!canSendOtp}
						className='w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{loading ? 'Sending OTP…' : 'Send OTP'}
					</button>
				</>
			)}

			{/* Step 2: Enter OTP */}
			{otpSent && !otpVerified && (
				<>
					<div>
						<label className='mb-1 block text-sm font-medium text-gray-600'>
							Enter OTP
						</label>
						<input
							type='text'
							inputMode='numeric'
							maxLength={8}
							value={otp}
							onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
							placeholder='Enter the OTP you received'
							className='w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500'
						/>
					</div>

					<button
						type='button'
						onClick={handleVerifyOtp}
						disabled={!canVerifyOtp}
						className='w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
					>
						Verify OTP
					</button>

					<button
						type='button'
						onClick={handleSendOtp}
						disabled={loading}
						className='w-full text-center text-xs text-indigo-500 hover:underline disabled:opacity-50'
					>
						Resend OTP
					</button>
				</>
			)}

			{/* Step 3: New password */}
			{otpVerified && (
				<>
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
