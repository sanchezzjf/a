import { describe, test, expect, jest, beforeEach } from '@jest/globals';

import UploadHandler from '../../src/uploadHandler';
import TestUtil from '../_util/testUtil';
import fs from 'fs'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger.js'
import { on } from 'events';

describe('#UploadHandler test suit', () => {
    const ioObj = {
                to: (id) => ioObj,
                emit: (event, message) => {}
            }

    beforeEach(() => {
        jest.spyOn(logger, 'info')
            .mockImplementation()
    })

    describe('#Register events', () => {
        test('should call onFile and onFinish functions on BusBoy instance', () => {
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01'
            })

            jest.spyOn(uploadHandler, uploadHandler.onFile.name)
                .mockResolvedValue();

            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }
            const onFinish = jest.fn()
            const busboyInstance = uploadHandler.registerEvents(headers, onFinish)



            const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
            busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')

            busboyInstance.listeners('finish')[0].call()
            expect(uploadHandler.onFile).toHaveBeenCalled()

            expect(onFinish).toHaveBeenCalled()
        })
    })

    describe('#onFile', () => {
        test('given a stream file it should save it on disk', async () => {
            const chunks = ['salve', 'meu', 'mano']
            const downloadsFolder = '/tmp'
            const handler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder
            })
            const onData = jest.fn()

            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateWritableStream(onData))
            
            const onTransform = jest.fn()
            jest.spyOn(handler, handler.handleFileBytes.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform))   

            const params = {
                fieldname: 'video',
                file: TestUtil.generateReadableStream(chunks),
                filename: 'mockFile.mp4'
            }
            await handler.onFile(...Object.values(params))

            expect(onData.mock.calls.join()).toEqual(chunks.join())
            expect(onTransform.mock.calls.join()).toEqual(chunks.join())

            const expectedFilename = resolve(handler.downloadsFolder, params.filename)
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
        })
    })

    describe('#handleFileBytes', () => {
        test('should call emit function and it is a transform stream', async () => {
            jest.spyOn(ioObj, ioObj.to.name)
            jest.spyOn(ioObj, ioObj.emit.name)

            const handler = new UploadHandler({
                io: ioObj,
                socketId: '01'
            })

            jest.spyOn(handler, handler.canExecute.name)
                .mockReturnValue(true)

            const msg = ['hello']
            const source = TestUtil.generateReadableStream(msg)
            const onWrite = jest.fn()
            const target = TestUtil.generateWritableStream(onWrite)

            await pipeline(
                source,
                handler.handleFileBytes("filename.txt"),
                target
            )

            expect(ioObj.to).toHaveBeenCalledTimes(msg.length)
            expect(ioObj.emit).toHaveBeenCalledTimes(msg.length)

            // if handleFileBytes was a transform stream, our pipeline
            // will continue the procces, passing the data and call
            // our function on target after every chunk
            expect(onWrite).toBeCalledTimes(msg.length)
            expect(onWrite.mock.calls.join()).toEqual(msg.join())

        })

        test('given message timerDelay as 2s it should emit only on messages during 2s period', async () => {
            jest.spyOn(ioObj, ioObj.emit.name)
            const messageTimeDelay = 2000

            const day = '2021-07-01 01:01'
            // Date.now of this.lastMsgSent on handleBytes
            const onFirstLastMsgSent = TestUtil.getTimeFromDate(`${day}:00`)

            // hello executed
            const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
            const onSecondUpdateLastMsgSent = onFirstCanExecute

            // son executed, out of the time 
            const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
            
            // whatsup
            const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

            TestUtil.mockDateNow([
                onFirstLastMsgSent,
                onSecondUpdateLastMsgSent,
                onFirstCanExecute,
                onSecondCanExecute,
                onThirdCanExecute
            ])

            const handler = new UploadHandler({
                messageTimeDelay,
                io: ioObj,
                socketId: '01'
            })
            const msgs = ['hello', 'son', 'whatsup']
            const filename = 'filename.mp3'
            const expectedMsgSent = 2

            const source = TestUtil.generateReadableStream(msgs)

            await pipeline(
                source,
                handler.handleFileBytes(filename)
            )

            expect(ioObj.emit).toHaveBeenCalledTimes(expectedMsgSent)

            const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

            expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename }])
            expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: msgs.join('').length, filename }])
        })
    })

    describe('#canExecute', () => {
        
        test('must return true when time is later than specified delay', () => {
            
            const timerDelay = 1000
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: '',
                messageTimeDelay: timerDelay
            })

            const now = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
            TestUtil.mockDateNow([now])

            const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')

            const result = uploadHandler.canExecute(lastExecution)
            expect(result).toBeTruthy()
        })
        test("must return false when the time isn't later than specified delay", () => {
            const timerDelay = 3000
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: '',
                messageTimeDelay: timerDelay
            })

            const now = TestUtil.getTimeFromDate('2021-07-01 00:00:01')
            TestUtil.mockDateNow([now])

            const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')

            const result = uploadHandler.canExecute(lastExecution)
            expect(result).toBeFalsy()
        })
    })
})