import AuthForm from "@/app/components/AuthForm"
import { Leaf } from 'lucide-react';

export default function LoginPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-200"
        >
            <div className="flex flex-col items-center mb-8">
                <div className="bg-green-600 text-white p-4 rounded-full mb-4">
                    <span className="text-2xl"><Leaf className="h-7 w-7" /></span>
                </div>

                <h1 className="text-xl font-semibold text-gray-800">EarthLink</h1>

                <p className="text-sm text-green-700 mt-1">Connecting communities for a sustainable future!</p>
            </div>

            <AuthForm mode="login" />
        </div>

    )
}