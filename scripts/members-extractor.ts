import * as XLSX from 'xlsx'
import * as fs from 'fs'

const inputFile = 'nouvelle-liste.xlsx' // fichier à exploiter
const sheetName = 'Liste fideles-tribu-Dpt-FH'
const outputFile = 'membres_vh_new.xlsx'

// Supprimer le fichier de sortie s'il existe
if (fs.existsSync(outputFile)) {
	fs.unlinkSync(outputFile)
	console.log(`🗑️ Ancien fichier supprimé : ${outputFile}`)
}

// Charger le fichier Excel existant
const workbook = XLSX.readFile(inputFile)

if (!workbook.SheetNames.includes(sheetName)) {
	throw new Error(`❌ Le classeur "${sheetName}" est introuvable.`)
}

// Lire les données du classeur "Liste membres"
const worksheet = workbook.Sheets[sheetName]
const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

// Traitement des données
const formatted = data.map(row => ({
	'Nom et prénoms': `${row['Nom'] || ''} ${row['Prénom'] || ''}`.trim(),
	'Numéro de téléphone': row['Mobile'] ? `225${row['Mobile']}` : '',
	Email: row['Email'] || '',
	Localisation: `${row['Ville'] || ''} ${row['Rue'] || ''}`.trim(),
	Genre: row['Genre'] === 'Féminin' ? 'F' : 'M',
	'Date de naissance': row['Date de naissance'] || '',
	'Situation Matrimoniale': row['Situation Matrimoniale'] || '',
	"Famille d'honneur": row['Famille'] || '',
	Tribu: row['Tribu'] || '',
	Département: row['Département'] || '',
}))

// Créer un nouveau classeur avec les colonnes formatées
const newWorksheet = XLSX.utils.json_to_sheet(formatted)
const newWorkbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Membres formatés')

// Sauvegarder dans un nouveau fichier
XLSX.writeFile(newWorkbook, outputFile)

console.log(`✅ Nouveau fichier généré : ${outputFile}`)
