import { useState } from 'react';
import { ForgotPasswordModal } from './forgot-password-modal';
import { login, setToken, type LoginResponse } from '../services/api-client';

interface LoginScreenProps {
	onLogin: (data: LoginResponse) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!username.trim() || !password.trim()) return;

		setError('');
		setLoading(true);

		try {
			const data = await login(username.trim(), password);
			setToken(data.token);
			onLogin(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Login failed. Please try again.',
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<div className='min-h-screen bg-linear-to-br from-indigo-50 to-sky-50 flex items-center justify-center p-4'>
				<div className='w-full max-w-sm'>
					{/* Logo / title */}
					<div className='text-center mb-8'>
						<div className='inline-flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-2xl shadow-lg mb-4'>
							<span className='text-3xl'>🌳</span>
						</div>
						<h1 className='text-2xl font-bold text-gray-800'>Family Tree</h1>
						<p className='text-sm text-gray-500 mt-1'>
							Sign in to view your family tree
						</p>
					</div>

					{/* Form */}
					<form
						onSubmit={handleSubmit}
						className='bg-white rounded-2xl shadow-xl p-8 space-y-5'
					>
						{error && (
							<div className='bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 border border-red-100'>
								{error}
							</div>
						)}

						<div>
							<label className='block text-sm font-medium text-gray-600 mb-1'>
								Username
							</label>
							<input
								type='text'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder='Enter username'
								autoFocus
								className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-600 mb-1'>
								Password
							</label>
							<input
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder='Enter password'
								className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm'
							/>
						</div>

						<button
							type='submit'
							disabled={loading || !username.trim() || !password.trim()}
							className='w-full py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md'
						>
							{loading ? 'Signing in…' : 'Sign In'}
						</button>

						<button
							type='button'
							onClick={() => setShowForgotPassword(true)}
							className='w-full text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700'
						>
							Forgot password?
						</button>
					</form>
				</div>
			</div>
			{showForgotPassword && (
				<ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
			)}
		</>
	);
}
