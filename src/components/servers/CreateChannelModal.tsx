import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { createChannel } from '../../lib/server-service';
import type { ServerChannel } from '../../types/server';
import { useDarkMode } from '../../hooks/useDarkMode';

interface Props {
  serverId: string;
  defaultType: 'chat' | 'post';
  onClose: () => void;
  onCreated: (channel: ServerChannel) => void;
}

export default function CreateChannelModal({ serverId, defaultType, onClose, onCreated}: Props){
  const [name,setName]=useState('');
  const [type] = useState<'chat'|'post'>(defaultType);
  const [loading,setLoading]=useState(false);
  const { isDarkMode, mounted } = useDarkMode();

  if (!mounted) {
    return null;
  }

  const handleSubmit=async()=>{
    if(!name.trim())return;
    setLoading(true);
    const newChan= await createChannel({server_id: serverId, name: name.trim(), type});
    setLoading(false);
    if(newChan){onCreated(newChan);}  
  }
  return(
    <Dialog open onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop: lighter dim */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <Dialog.Panel className={`relative ${
        isDarkMode ? 'bg-slate-800/100' : 'bg-white/100'
      } rounded-xl p-6 w-96 space-y-6 shadow-xl border ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <Dialog.Title className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Create {type==='chat'?'Chat':'Post'} Channel</Dialog.Title>
        <div className="space-y-2">
          <label className={`text-sm font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Channel Name</label>
          <input 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            className={`w-full rounded-lg border ${
              isDarkMode 
                ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } px-3 py-2 text-sm outline-none focus:border-primary`} 
            placeholder="my-channel"
          />
        </div>

        {/* Channel type fixed to prop; toggle removed */}

        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className={`px-3 py-1 rounded text-sm ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button 
            disabled={loading} 
            onClick={handleSubmit} 
            className="px-4 py-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading?'Creating…':'Create'}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
} 