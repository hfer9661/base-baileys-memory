const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
require('dotenv').config()
const axios = require('axios')
const WsProvider = require('@bot-whatsapp/provider/baileys')
const DBProvider = require('@bot-whatsapp/database/mock')
require('dotenv').config();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

function removeHtmlTagsAndEntities(input) {
    const withoutHtmlTags = input.replace(/<\/?[^>]+(>|$)/g, "");
    return withoutHtmlTags.replace(/&[^;]+;/g, "");
}
  
const WooCommerce = new WooCommerceRestApi({
    url: "https://floreriaelys.com",
    consumerKey: process.env.WOOCommerce_CONSUMER_KEY,
    consumerSecret: process.env.WOOCommerce_CONSUMER_SECRET,
    version: "wc/v3",
  })

  const menuAPI = async () => {
    try {
      const response = await WooCommerce.get("products");
      const products = response.data;
  
      const formattedMenu = products.map((product, index) => {
        const name = product.name;
        const price = product.price;
        const imageUrl = product.images[0].src; // Obtén la URL de la primera imagen (puedes ajustar esto según tu necesidad)
  
        return `${index + 1}. *${name} - Precio:* S/.${price}\n${imageUrl}`;
      });
  
      return formattedMenu.join("\n");
    } catch (error) {
      console.error("Error al obtener el menú:", error);
      throw error;
    }
  };
  
menuAPI()
  .then((menu) => {
    console.log("Menú obtenido:", menu);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const flujoContraentrega = addKeyword('contra entrega').addAnswer('Se registrará su pedido 🤗')
const flujoYape = addKeyword('yape').addAnswer('Pagar al siguiente número: 992378833 🤑')

const flujoPedido = addKeyword('pedir')
.addAnswer('¿Como piensas pagar? *Contra entrega* o *Yape*', null, null, [flujoContraentrega, flujoYape])

const flujoPrincipal = addKeyword('hola','buenos dias')
.addAnswer(['Bienvenido a Floreria Elys 🌸','Hoy tenemos las siguientes ofertas'])
.addAnswer('Productos disponibles:', null, async (ctx,{flowDynamic}) => {
    const data = await menuAPI()
    flowDynamic(data)
})
.addAnswer('Escribe *pedir* si te interesa algo ✍️', {
    delay:1500
}, null, [flujoPedido])

/*.addAnswer('¿Cual es tu email?',{capture:true},(ctx, {fallBack}) => {

    if(!ctx.body.includes('@')) {
        return fallBack()
    }

    console.log('Mensaje entrante: ',ctx.body)
})
.addAnswer('en los siguientes minutos te envio un email')*/

const flujoSecundario = addKeyword('gracias').addAnswer('De nada! 😊')

const main = async () => {
    const adapterDB = new DBProvider();
    const adapterFlow = createFlow([flujoPrincipal, flujoSecundario]);
    const adapterProvider = createProvider(WsProvider);
  
    const bot = createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
  
    // Obtener el menú
    const menu = await menuAPI();
  
    // Enviar cada producto como un mensaje individual
    menu.split("\n").forEach((menuItem) => {
      const [message, imageUrl] = menuItem.split("\n");
      // Aquí debes utilizar la función o método apropiado para enviar mensajes en WhatsApp,
      // incluyendo la URL de la imagen si está presente
      // Ejemplo: bot.sendTextWithImage('Número de teléfono', message, imageUrl);
      console.log("Mensaje enviado:", message);
  
      if (imageUrl) {
        console.log("URL de la imagen:", imageUrl);
        // Aquí puedes procesar la URL de la imagen según tu necesidad
      }
    });
  };
  
  main();