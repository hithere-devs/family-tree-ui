import { OtpPasswordResetForm } from './otp-password-reset-form';

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
			onClick={onClose}
		>
			<div
				className='w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl'
				onClick={(e) => e.stopPropagation()}
			>
				<OtpPasswordResetForm
					title='Forgot Password'
					description='Use your username and verified phone number to reset the password with OTP.'
					onSuccess={onClose}
					submitLabel='Set New Password'
				/>
				<button
					type='button'
					onClick={onClose}
					className='mt-4 w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200'
				>
					Close
				</button>
			</div>
		</div>
	);
}
