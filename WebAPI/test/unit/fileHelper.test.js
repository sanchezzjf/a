import { describe, test, expect, jest } from '@jest/globals';

import Routes from '../../src/routes';
import fs from 'fs'
import FileHelper from '../../src/fileHelper.js'

describe('#FileHelper test suit', () => {

    describe('#getFileStatus', () => {
        test('it should return files statuses in correct format', async () => {
            
            const statMock = {
                    dev: 2097,
                    mode: 33204,
                    nlink: 1,
                    uid: 1000,
                    gid: 1000,
                    rdev: 0,
                    blksize: 4096,
                    ino: 27001682,
                    size: 2912489,
                    blocks: 5696,
                    atimeMs: 1631497129691.6255,
                    mtimeMs: 1631497129703.6255,
                    ctimeMs: 1631497129703.6255,
                    birthtimeMs: 1631497129691.6255,
                    atime: '2021-09-13T01:38:49.692Z',
                    mtime: '2021-09-13T01:38:49.704Z',
                    ctime: '2021-09-13T01:38:49.704Z',
                    birthtime: '2021-09-13T01:38:49.692Z'
            }

            const mockUser = 'Joao'
            process.env.USER = mockUser
            const filename = 'file.jpg'
            
            jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([filename])
            jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock)
            
            const result = await FileHelper.getFileStatus("/tmp") //only for testing

            const expectedResult = [
                {
                    size: '2.91 MB', //in bytes
                    lastModified: statMock.birthtime,
                    owner: mockUser,
                    file: filename
                }
            ]

            expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
            expect(result).toMatchObject(expectedResult)
        })
    })
})
