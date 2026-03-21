import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
	children: ReactNode;
}

interface AppErrorBoundaryState {
	hasError: boolean;
	message: string;
}

export class AppErrorBoundary extends Component<
	AppErrorBoundaryProps,
	AppErrorBoundaryState
> {
	state: AppErrorBoundaryState = {
		hasError: false,
		message: '',
	};

	static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
		return {
			hasError: true,
			message: error.message || 'Unexpected application error',
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('App render failed', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='flex min-h-screen items-center justify-center bg-gray-50 p-6'>
					<div className='w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-lg'>
						<h1 className='text-lg font-semibold text-gray-900'>
							Application Error
						</h1>
						<p className='mt-2 text-sm text-gray-600'>
							A render error occurred after the app loaded.
						</p>
						<pre className='mt-4 overflow-x-auto rounded-lg bg-red-50 p-4 text-xs text-red-700'>
							{this.state.message}
						</pre>
						<button
							type='button'
							onClick={() => window.location.reload()}
							className='mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600'
						>
							Reload
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
