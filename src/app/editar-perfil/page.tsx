'use client';

// 🔹 React & Firebase
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// 🔹 App & Icons
import { app } from '@/lib/firebase';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

// 🔹 Tipagem
interface UserProfile {
  name: string;
  peso: number;
  metadePeso: number;
  altura: number;
  objetivo: string;
  genero: string;
  biotipo: string;
  dataNascimento: string;
  atividadesSemana: number;
  refeicoesDia: number;
}

export default function EditarPerfil() {
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const ref = doc(db, 'userProfile', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setFormData(snap.data() as UserProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;

      const isNumber = ['peso', 'metadePeso', 'altura', 'atividadesSemana', 'refeicoesDia'].includes(name);
      return {
        ...prev,
        [name]: isNumber ? Number(value) : value
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setSaving(true);

    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
    const ref = doc(db, 'userProfile', user.uid);
    await updateDoc(ref, { ...formData });

    setSaving(false);
    setShowToast(true);
    setTimeout(() => router.push('/perfil'), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl font-bold text-green-400 mb-8 font-bebas text-center">
        Editar Perfil
      </h1>

      {loading || !formData ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-xl border border-white/10">
            {Object.entries(formData)
              .filter(([key]) => key !== 'userId' && key !== 'createdAt')
              .map(([key, value]) => (
                <div key={key}>
                  <label className="text-green-400 block mb-1 capitalize">{key}</label>
                  <input
                    className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600"
                    name={key}
                    value={value}
                    onChange={handleChange}
                    type={typeof value === 'number' ? 'number' : 'text'}
                  />
                </div>
              ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg w-full justify-center"
          >
            <Save className="w-5 h-5" /> Salvar Alterações
          </button>

          {showToast && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
              <CheckCircle2 className="w-5 h-5" /> Alterações salvas com sucesso!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
