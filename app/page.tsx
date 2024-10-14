// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Learn ASL Letters</h1>
        <p>Select a lesson to get started:</p>
        <div className="mt-4">
          <Link href="/lesson?lesson=A-D">Lesson 1: A - D</Link><br />
          <Link href="/lesson?lesson=E-H">Lesson 2: E - H</Link><br />
          <Link href="/lesson?lesson=I-L">Lesson 3: I - L</Link>
        </div>
      </div>
  );
}
