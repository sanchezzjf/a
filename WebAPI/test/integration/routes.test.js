import { describe, test, expect, jest, beforeAll, afterAll } from '@jest/globals'
import fs from 'fs'
import FileHelper from '../../src/fileHelper.js'
import Routes from '../../src/routes.js'
import FormData from 'form-data'
import TestUtil from '../_util/testUtil.js'
import { logger } from '../../src/logger.js'
import { tmpdir } from 'os'
import { join } from 'path'

describe('#Routes Integration test', () => {

    let defaultDownloadsFolder = ''
    beforeAll(async () => {
        defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
    })

    afterAll(async () => {
        await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
    })

    beforeEach(() => {
        jest.spyOn(logger, 'info')
            .mockImplementation()
    })
    describe('#getFileStatus', () => {

        const ioObj = {
            to: (id) => ioObj,
            emit: (event, message) => {}
        }

        test('should upload file to folder', async () => {
            const filename = 'spiderverse.png'
            const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
            const response = TestUtil.generateWritableStream(() => {})

            const form = new FormData()
            form.append('photo', fileStream)

            const defaultParams = {
                request: Object.assign(form, {
                    headers: form.getHeaders(),
                    method: 'POST',
                    url: '?socketId=01'
                }),
                response: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(defaultParams)
            }
            const routes = new Routes(defaultDownloadsFolder)
            routes.setSocketInstance(ioObj)
            
            const dirBefore = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dirBefore).toEqual([])

            await routes.handler(...defaultParams.values())

            const dirAfter = await fs.promises.readdir(defaultDownloadsFolder)
            expect(dirAfter).toEqual([filename])

            expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
            const expectedResult = JSON.stringify({ result: 'Files uploaded successfuly!' })
            expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)


        })
    })
})
