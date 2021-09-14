import fs from 'fs'
import prettyBytes from 'pretty-bytes'

export default class FileHelper {
    static async getFileStatus(downloadsFolder) {
        const currentFiles = await fs.promises.readdir(downloadsFolder)
        const statuses = await Promise
                                .all(currentFiles
                                    .map(
                                        file => fs.promises.stat(`${downloadsFolder}/${file}`)
                                    )
                                )
        const filesStatuses = []
        for( const fileIndex in currentFiles ){
            const { birthtime, size } = statuses[fileIndex] // all the data from the files
            filesStatuses.push({
                size: prettyBytes(size),
                file: currentFiles[fileIndex], // just the name of them
                lastModified: birthtime,
                owner: process.env.USER
            })
        }

        return filesStatuses
    }
}