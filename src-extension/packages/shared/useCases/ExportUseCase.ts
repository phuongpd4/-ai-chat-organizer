import { ChatNode, Folder } from '../core/types.js';

export class ExportUseCase {
    static exportFolder(folder: Folder, allChats: ChatNode[], format: 'json' | 'md') {
        const chatsToExport = allChats.filter(c => c.folderId === folder.id);

        let content = '';
        let filename = `${folder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export`;
        let mimeType = 'text/plain';

        if (format === 'json') {
            const exportData = {
                folder: folder.name,
                exportedAt: new Date().toISOString(),
                chats: chatsToExport.map(c => ({
                    title: c.title,
                    url: c.url,
                    platform: c.platform,
                    createdAt: new Date(c.createdAt).toISOString()
                }))
            };
            content = JSON.stringify(exportData, null, 2);
            filename += '.json';
            mimeType = 'application/json';
        } else if (format === 'md') {
            content += `# Folder: ${folder.name}\n\n`;
            content += `*Exported at: ${new Date().toLocaleString('en-GB')}*\n\n`;
            content += `## Chats (${chatsToExport.length})\n\n`;
            chatsToExport.forEach(c => {
                content += `- **[${c.platform}]** [${c.title}](${c.url}) - *Created: ${new Date(c.createdAt).toLocaleString('en-GB')}*\n`;
            });
            filename += '.md';
            mimeType = 'text/markdown';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
