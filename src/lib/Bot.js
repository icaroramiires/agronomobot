'use strict'

import TelegramBot from 'node-telegram-bot-api'
const watson = require('watson-developer-cloud')
import path from 'path'
import fs from 'fs'
const url = require('url')
import request  from 'request'

import Message from './message'
import config from '../config'
import InputParser from './inputParser'
import handlers from '../handlers'

const inputParser = new InputParser()

export default class Bot {
  constructor () {
    if (process.env.NODE_ENV === 'production') {
      this.bot = new TelegramBot(config.telegram.token, {
        webHook: {
          port: config.telegram.port
        }
      })
      this.bot.setWebHook(
        `${config.telegram.externalUrl}:443/bot${config.telegram.token}`
      )
    } else {
      this.bot = new TelegramBot(config.telegram.token, {
        polling: true
      })
    }

    this.conversation = watson.conversation({
      username: config.watson.conversation.username,
      password: config.watson.conversation.password,
      version: config.watson.conversation.version,
      version_date: config.watson.conversation.version_date
    })
  }

  // fica ouvindo se uma mensagem foi enviada
  listen () {
    this.bot.on('text', this.handleText.bind(this))
    return Promise.resolve()
  }

  // processa o texto enviado
  handleText (msg) {
    const message = new Message(Message.mapMessage(msg))

    this.conversation.message(
      {
        workspace_id: config.watson.workspace_id,
        input: { text: msg.text },
        context: {}
      },
      (err, resp) => {
        if (err) {
          console.log(`Error: ${err}`)
        } else {
          if (inputParser.isAskingForWelcome(resp)) {
            return handlers.command.sendMessageWelcome(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForMenu(resp)) {
            return handlers.command.sendMessageMenu(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForHelp(resp)) {
            return handlers.command.sendMessageHelp(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForInfoNodes(resp)) {
            return handlers.command.sendInfoNodes(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForMolhamentoFoliar(resp)) {
            return handlers.command.sendInfoSensorsMolhamentoFoliar(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForRadiacaoSolar(resp)) {
            return handlers.command.sendInfoSensorsRadiacaoSolar(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForUmidade(resp)) {
            return handlers.command.sendInfoSensorsUmidade(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForTemperatura(resp)) {
            return handlers.command.sendInfoSensorsTemperatura(
              message,
              resp.output.text[0],
              this.bot
            )
          }

          if (inputParser.isAskingForReports(resp)) {
            const buffer = fs.readFileSync(path.join(__dirname, 'relatorio.pdf'))
            this.bot.sendDocument(message.chat, buffer)
          }
    
          if (inputParser.isAskingForReportSensor(resp)) {
            return handlers.command.sendReportSensors(message, this.bot)
          }

          if (inputParser.isAskingForReportNode(resp)) {
            return handlers.command.sendReportNodes(message, this.bot)
          }
        }
      }
    )
  }
}
