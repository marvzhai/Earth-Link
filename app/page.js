import { redirect } from 'next/navigation';

// Redirect home to events page
export default function Home() {
  redirect('/events');
}
