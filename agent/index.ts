import { Agent, Field, Runner } from '@guava-ai/guava-sdk';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  if (!process.env.GUAVA_API_KEY || process.env.GUAVA_API_KEY === 'replace-with-a-new-key') {
    throw new Error('Add your new Guava API key to .env.local before starting the agent.');
  }
  process.env.GUAVA_HEALTH_SERVER = 'true';
  const directory = path.join(process.cwd(), 'data');
  await mkdir(directory, { recursive: true });
  const agent = new Agent({
    name: 'Maya',
    organization: process.env.AGENT_BUSINESS_NAME || 'Customer Care Demo',
    purpose: `You are Maya, a friendly bilingual Bangla (Bengali) and English AI customer intake assistant. Identify yourself as AI. At the beginning briefly greet the caller and ask whether they prefer Bangla or English. Follow their choice throughout the call, including consent, questions, confirmation and goodbye. If they start speaking Bangla, respond in Bangla; if they speak English, respond in English. Understand mixed Bangla-English conversation and switch immediately when asked, without restarting intake or losing collected details. Use natural, simple sentences and one short question at a time. Preserve names as provided and read phone numbers digit by digit in the chosen language. If you cannot understand or speak the requested language, explain the limitation honestly and offer English; never pretend to understand. Collect only name, callback phone number, and their request. Never invent prices, policies, orders or bookings. This is a demo: no order is placed and no callback is guaranteed. If a caller declines to share details, respect that and end politely.`,
  });

  agent.onCallStart(async call => {
    await call.setTask({
      taskId: 'customer_intake',
      objective: 'Introduce yourself as an AI assistant and establish whether the caller prefers Bangla or English. Conduct the entire intake in their chosen language, and switch languages if requested. Explain this demo saves confirmed contact details locally, and ask permission to collect them. If permission is declined, end the call without completing the task. Otherwise collect and confirm a customer enquiry.',
      checklist: [
        'Ask whether the caller prefers Bangla or English unless their preference is already clear. Continue in their preferred language when supported; explain honestly if it is unavailable.',
        'Get permission to collect and save the contact details for this demo.',
        Field({ key: 'customer_name', fieldType: 'text', description: 'The customer’s name. Ask how to spell it if unclear.' }),
        Field({ key: 'phone_number', fieldType: 'text', description: 'The callback phone number including country code. Read digits back and correct errors.' }),
        Field({ key: 'customer_request', fieldType: 'text', description: 'A brief description of what the customer needs.' }),
        'Read all collected information back. Ask the caller to confirm it is correct, and apply any corrections.',
      ],
      completionCriteria: 'The caller has consented to saving their details and explicitly confirmed the name, phone number and request. Never complete this task if consent is declined.',
    });
  });

  agent.onTaskComplete('customer_intake', async call => {
    const fields = {
      customer_name: await call.getField('customer_name'),
      phone_number: await call.getField('phone_number'),
      customer_request: await call.getField('customer_request'),
    };
    await appendFile(path.join(directory, 'records.jsonl'), JSON.stringify({ id: crypto.randomUUID(), at: new Date().toISOString(), fields }) + '\n', 'utf8');
    await call.hangup('In the caller’s chosen language, thank them and say their enquiry details have been saved for this demo. Do not promise a callback or say an order has been placed.');
  });

  const runner = new Runner();
  const channels = (process.env.GUAVA_CHANNELS || 'webrtc,phone,sip').split(',').map(channel => channel.trim());
  if (channels.includes('webrtc')) runner.listenWebrtc(agent, process.env.NEXT_PUBLIC_GUAVA_WEBRTC_CODE || 'grtc-C4lL313vMSat6r2ePSYnEY2AkyuxaBZpBLk02wZl');
  if (channels.includes('phone')) runner.listenPhone(agent, process.env.GUAVA_AGENT_NUMBER || '+12677470494');
  if (channels.includes('sip')) runner.listenSip(agent, process.env.GUAVA_SIP_CODE || 'guavasip-2wfo3y81a8azejytbttnr8s744oqovkqdmmwmdjn');
  if (!channels.some(channel => ['webrtc', 'phone', 'sip'].includes(channel))) throw new Error('GUAVA_CHANNELS must contain webrtc, phone, or sip.');
  console.log('Starting customer intake agent. Keep this terminal open while testing.');
  await runner.run();
}

main().catch(() => {
  console.error('Agent could not run. Check your new API key, channel ownership, internet connection, and whether another agent is already listening.');
  process.exitCode = 1;
});
