const fs = require('fs');

const FILE_PATH = 'src/components/edit-person.tsx';
let text = fs.readFileSync(FILE_PATH, 'utf8');

const st1 = "\tconst [gender, setGender] = useState<Gender>(person?.gender ?? 'male');\n\tconst [isDeceased, setIsDeceased] = useState(person?.isDeceased ?? false);";
const rp1 = st1 + "\n\tconst [bio, setBio] = useState(person?.bio ?? '');\n\tconst [location, setLocation] = useState(person?.location ?? '');\n\tconst [birthDate, setBirthDate] = useState(person?.birthDate ?? '');";

const st2 = "\t\t\tawait api.updatePerson(person.id, {\n\t\t\t\tfirstName,\n\t\t\t\tlastName,\n\t\t\t\tgender,\n\t\t\t\tisDeceased,\n\t\t\t});";
const rp2 = "\t\t\tawait api.updatePerson(person.id, {\n\t\t\t\tfirstName,\n\t\t\t\tlastName,\n\t\t\t\tgender,\n\t\t\t\tisDeceased,\n\t\t\t\tbio: bio || undefined,\n\t\t\t\tlocation: location || undefined,\n\t\t\t\tbirthDate: birthDate || undefined,\n\t\t\t});";

const st3 = "\t\t\t\t{/* Status */}\n\t\t\t\t<div className='flex items-center gap-3 bg-gray-50 p-4 rounded-xl'>";
const rp3 = `\t\t\t\t{/* Biography */}
\t\t\t\t<div>
\t\t\t\t\t<label className='block text-sm font-medium text-gray-700 mb-1'>Biography</label>
\t\t\t\t\t<textarea
\t\t\t\t\t\tvalue={bio}
\t\t\t\t\t\tonChange={(e) => setBio(e.target.value)}
\t\t\t\t\t\tclassName='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-800'
\t\t\t\t\t\tplaceholder='A short bio...'
\t\t\t\t\t\trows={3}
\t\t\t\t\t/>
\t\t\t\t</div>

\t\t\t\t<div className='grid grid-cols-2 gap-4'>
\t\t\t\t\t<div>
\t\t\t\t\t\t<label className='block text-sm font-medium text-gray-700 mb-1'>Location</label>
\t\t\t\t\t\t<input
\t\t\t\t\t\t\ttype='text'
\t\t\t\t\t\t\tvalue={location}
\t\t\t\t\t\t\tonChange={(e) => setLocation(e.target.value)}
\t\t\t\t\t\t\tclassName='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all'
\t\t\t\t\t\t\tplaceholder='City, Country'
\t\t\t\t\t\t/>
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<label className='block text-sm font-medium text-gray-700 mb-1'>Birth Date</label>
\t\t\t\t\t\t<input
\t\t\t\t\t\t\ttype='date'
\t\t\t\t\t\t\tvalue={birthDate ? birthDate.substring(0, 10) : ''}
\t\t\t\t\t\t\tonChange={(e) => setBirthDate(e.target.value)}
\t\t\t\t\t\t\tclassName='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all'
\t\t\t\t\t\t/>
\t\t\t\t\t</div>
\t\t\t\t</div>

\t\t\t\t{/* Status */}
\t\t\t\t<div className='flex items-center gap-3 bg-gray-50 p-4 rounded-xl'>`;

// Helper to normalize indentations for reliable string replacement
function normalizeSpaces(str) {
    return str.replace(/\t/g, ' ').replace(/\s+/g, ' ');
}

if (!text.includes("bio: bio || undefined")) {
    // Basic replace for st1
    let success = false;
    
    // Convert text to use one format or we can use regexes
    const lines = text.split('\n');
    let outLines = [];
    let stateIdx = -1;
    let saveIdx = -1;
    let statusIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const [isDeceased, setIsDeceased] = useState')) {
            stateIdx = i;
        }
        if (lines[i].includes('isDeceased,') && lines[i-1] && lines[i-1].includes('gender,')) {
            saveIdx = i;
        }
        if (lines[i].includes('{/* Status */}')) {
            statusIdx = i;
        }
    }
    
    if (stateIdx !== -1 && saveIdx !== -1 && statusIdx !== -1) {
        let newContent = [...lines];
        
        // st1
        newContent.splice(stateIdx + 1, 0, 
            "\tconst [bio, setBio] = useState(person?.bio ?? '');",
            "\tconst [location, setLocation] = useState(person?.location ?? '');",
            "\tconst [birthDate, setBirthDate] = useState(person?.birthDate ?? '');"
        );
        
        // saveIdx got shifted by 3
        saveIdx += 3;
        newContent.splice(saveIdx + 1, 0,
            "\t\t\t\tbio: bio || undefined,",
            "\t\t\t\tlocation: location || undefined,",
            "\t\t\t\tbirthDate: birthDate || undefined,"
        );
        
        // statusIdx shifted by 6
        statusIdx += 6;
        let p3Lines = rp3.split('\\n');
        // wait rp3 has actual newlines
        let p3LinesActual = rp3.split('\\n').length > 1 ? rp3.split('\\n') : rp3.split('\n');
        
        // Replace {/* Status */} and the div with rp3
        newContent.splice(statusIdx, 2, ...p3LinesActual);
        
        fs.writeFileSync(FILE_PATH, newContent.join('\n'));
        console.log('Successfully patched EditPerson');
    } else {
        console.log('Could not find all markers', {stateIdx, saveIdx, statusIdx});
    }
} else {
    console.log('Already patched');
}
