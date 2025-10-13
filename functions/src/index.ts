import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';


// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Configuração Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // +1234567890
//eslint-disable-next-line
const twilio = require('twilio')(accountSid, authToken);

// Tipos de mensagem por horário
const messageTemplates = {
  breakfast: {
    motivacional: [
      "🌅 Bom dia! Que tal começar com uma refeição nutritiva?",
      "☀️ Novo dia, nova energia! Hora do café da manhã saudável!",
      "🥗 Desperte seu corpo com uma refeição balanceada!"
    ],
    recipe: [
      "🍳 Dica rápida: Ovo mexido com aveia é energia instantânea!",
      "🥛 Smoothie de banana + aveia = café da manhã perfeito!",
      "🍞 Pão integral + abacate = combustível para o dia!"
    ],
    tip: [
      "💡 Dica: Hidrate-se assim que acordar - seu corpo agradece!",
      "⚡ Lembre-se: Café da manhã é o combustível do seu dia!",
      "🎯 Meta: Inclua proteína no café da manhã para mais saciedade!"
    ]
  },
  lunch: {
    motivacional: [
      "🌞 Meio-dia chegou! Hora de nutrir seu corpo com carinho!",
      "💪 Pausa para o almoço = pausa para cuidar de você!",
      "🍽️ Que tal fazer dessa refeição um momento especial?"
    ],
    recipe: [
      "🥘 Dica: Arroz + feijão + salada = combinação brasileira perfeita!",
      "🐟 Peixe grelhado + legumes no vapor = almoço leve e nutritivo!",
      "🥗 Salada colorida + proteína = energia para a tarde!"
    ],
    tip: [
      "🕐 Dica: Coma devagar e mastigue bem - sua digestão agradece!",
      "🥕 Inclua pelo menos 2 cores diferentes no seu prato!",
      "💧 Não esqueça: água durante o almoço ajuda na digestão!"
    ]
  },
  dinner: {
    motivacional: [
      "🌙 Fim de dia chegando! Hora de uma refeição reconfortante!",
      "✨ Jantar é momento de gratidão pelo dia que passou!",
      "🍽️ Termine o dia cuidando bem de você!"
    ],
    recipe: [
      "🍲 Sopa de legumes é perfeita para o jantar - leve e nutritiva!",
      "🥗 Salada + proteína magra = jantar ideal para boa noite de sono!",
      "🐟 Peixe assado + vegetais = jantar leve e saboroso!"
    ],
    tip: [
      "🕰️ Dica: Jante pelo menos 2h antes de dormir!",
      "🥬 Prefira alimentos leves no jantar para melhor digestão!",
      "😴 Evite cafeína no jantar - seu sono agradece!"
    ]
  }
};

// Função principal - executa diariamente às 6h
export const scheduleWhatsAppNotifications = onSchedule(
  { schedule: '0 6 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    try {
      logger.info('Iniciando agendamento de notificações WhatsApp');
      
      // Buscar usuários com WhatsApp configurado
      const usersSnapshot = await db.collection('users')
        .where('whatsapp', '!=', null)
        .get();

      if (usersSnapshot.empty) {
        logger.info('Nenhum usuário com WhatsApp encontrado');
        return;
      }

      const today = new Date();
      const promises: Promise<unknown>[] = [];

      // Para cada usuário
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Verificar se tem horários configurados
        if (!userData.mealTimes) continue;

        // Criar notificações para cada refeição
        const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;
        
        for (const mealType of mealTypes) {
          const mealTime = userData.mealTimes[mealType];
          if (!mealTime) continue;

          // Calcular horário de envio
          const [hours, minutes] = mealTime.split(':');
          const scheduledTime = new Date(today);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Se já passou do horário, agendar para amanhã
          if (scheduledTime < new Date()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }

          // Escolher tipo de mensagem e conteúdo aleatório
          const messageType = getRandomMessageType();
          const message = getRandomMessage(mealType, messageType);

          // Criar documento de notificação
          const notificationData = {
            targetId: userId,
            category: messageType,
            type: 'mealReminder',
            plataform: 'whatsapp',
            status: 'scheduled',
            title: `Lembrete ${mealType}`,
            message: message,
            scheduledFor: scheduledTime,
            createdAt: new Date(),
            read: false,
            actions: {
              plataform: 'whatsapp',
              status: 'scheduled',
              targetId: userId,
              type: 'mealReminder'
            }
          };

          // Adicionar à lista de promessas
          promises.push(
            db.collection('notifications').add(notificationData)
          );
        }
      }

      // Executar todas as criações
      await Promise.all(promises);
      logger.info(`${promises.length} notificações agendadas com sucesso`);

    } catch (error) {
      logger.error('Erro ao agendar notificações:', error);
    }
  }
);

// Função para enviar notificações agendadas
export const sendScheduledNotifications = onSchedule(
  { schedule: '*/5 * * * *', timeZone: 'America/Sao_Paulo' }, // A cada 5 minutos
  async () => {
    try {
      const now = new Date();
      
      // Buscar notificações agendadas que devem ser enviadas
      const notificationsSnapshot = await db.collection('notifications')
        .where('status', '==', 'scheduled')
        .where('plataform', '==', 'whatsapp')
        .where('scheduledFor', '<=', now)
        .limit(50) // Limitar para evitar timeout
        .get();

      if (notificationsSnapshot.empty) return;

      logger.info(`Enviando ${notificationsSnapshot.size} notificações WhatsApp`);

      // Processar cada notificação
      for (const notificationDoc of notificationsSnapshot.docs) {
        const notification = notificationDoc.data();
        const notificationId = notificationDoc.id;

        try {
          // Buscar dados do usuário
          const userDoc = await db.collection('users').doc(notification.targetId).get();
          if (!userDoc.exists) continue;

          const userData = userDoc.data();
          if (!userData?.whatsapp) continue;

          // Enviar via Twilio
          const message = await twilio.messages.create({
            body: notification.message,
            from: twilioPhone,
            to: userData.whatsapp
          });

          // Atualizar status da notificação
          await db.collection('notifications').doc(notificationId).update({
            status: 'sent',
            sentAt: new Date(),
            twilioSid: message.sid
          });

          logger.info(`Notificação enviada para ${userData.whatsapp}: ${message.sid}`);

        } catch (error) {
          logger.error(`Erro ao enviar notificação ${notificationId}:`, error);
          
          // Marcar como erro
          await db.collection('notifications').doc(notificationId).update({
            status: 'error',
            error: error as string,
            sentAt: new Date()
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao enviar notificações agendadas:', error);
    }
  }
);

// Webhook para receber status do Twilio
export const twilioWebhook = onRequest(async (req, res) => {
  try {
    const { MessageSid, MessageStatus, From, Body } = req.body;

    if (MessageStatus === 'delivered' || MessageStatus === 'read') {
      // Atualizar status da notificação
      const notificationsSnapshot = await db.collection('notifications')
        .where('twilioSid', '==', MessageSid)
        .limit(1)
        .get();

      if (!notificationsSnapshot.empty) {
        const notificationDoc = notificationsSnapshot.docs[0];
        await notificationDoc.ref.update({
          status: MessageStatus,
          deliveredAt: new Date()
        });
      }
    }

    // Se houver resposta do usuário
    if (Body && Body.trim()) {
      logger.info(`Resposta recebida de ${From}: ${Body}`);
      
      // Aqui você pode implementar lógica para processar respostas
      // Por exemplo, atualizar engagement do usuário
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Erro no webhook Twilio:', error);
    res.status(500).send('Error');
  }
});

// Funções auxiliares
function getRandomMessageType(): 'motivacional' | 'recipe' | 'tip' {
  const types = ['motivacional', 'recipe', 'tip'] as const;
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomMessage(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  messageType: 'motivacional' | 'recipe' | 'tip'
): string {
  const messages = messageTemplates[mealType][messageType];
  return messages[Math.floor(Math.random() * messages.length)];
}