import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Legales, pedidos, pagos y privacidad",
  description: "Condiciones de solicitud, confirmación, cancelaciones, reembolsos y uso de datos en DOLCE Repostería.",
};
const sections = [
  {title:"1. Naturaleza de las solicitudes", paragraphs:[
    "DOLCE Repostería, en Matagalpa, Nicaragua, presenta su catálogo y recibe solicitudes mediante esta página. Enviar el formulario genera una solicitud sujeta a revisión; no garantiza disponibilidad, reserva de productos ni aceptación inmediata.",
    "El equipo de DOLCE se comunicará por WhatsApp con el número proporcionado para confirmar el producto, la fecha, la modalidad de entrega, el importe definitivo y cualquier condición particular. El precio mostrado corresponde a los productos y no incluye un eventual costo de envío, que se cotiza por separado."
  ]},
  {title:"2. Pagos seguros y comprobantes", paragraphs:[
    "Esta página no solicita datos bancarios, números de tarjeta ni realiza cobros en línea. Una vez confirmado el pedido por el equipo de DOLCE, el pago podrá coordinarse por transferencia bancaria o efectivo, según las opciones ofrecidas directamente por el negocio.",
    "No realices depósitos basándote exclusivamente en un formulario, una captura de pantalla o un mensaje de terceros. Verifica por el canal oficial del negocio los datos de pago y conserva tu comprobante. DOLCE verificará la recepción del pago antes de considerarlo acreditado."
  ]},
  {title:"3. Datos falsos y solicitudes no verificables", paragraphs:[
    "El cliente debe proporcionar información de contacto y entrega verdadera y mantener accesible su número para la confirmación. DOLCE podrá dejar sin efecto una solicitud no confirmada, duplicada, con datos manifiestamente falsos o que no pueda verificar razonablemente, informándolo cuando exista un medio de contacto válido.",
    "La emisión de una solicitud no obliga al negocio a iniciar la producción sin confirmación. Estas medidas no limitan las responsabilidades legales de DOLCE ni los derechos de las personas consumidoras respecto de pedidos ya acordados o pagados."
  ]},
  {title:"4. Cambios, cancelaciones y productos personalizados", paragraphs:[
    "Para cambiar o cancelar una solicitud, comunícate por el WhatsApp oficial tan pronto como sea posible. Antes de confirmar el pedido, se podrá actualizar o cancelar sin pago alguno en la web.",
    "En encargos confirmados, especialmente productos personalizados o perecederos, DOLCE informará antes de la elaboración sobre plazos y condiciones específicas. Cualquier condición acordada deberá respetar la legislación aplicable y los derechos irrenunciables de las personas consumidoras."
  ]},
  {title:"5. Reembolsos y reclamaciones", paragraphs:[
    "Como esta página no recibe dinero, no puede efectuar ni procesar reembolsos directamente. Si el cliente ya pagó mediante un canal confirmado por DOLCE y solicita la devolución, el negocio revisará el comprobante, el estado del encargo y las circunstancias del caso.",
    "Cuando corresponda legalmente una devolución, reposición o solución por incumplimiento, defecto o cobro indebido, DOLCE atenderá la reclamación conforme a la normativa vigente. Esta política no establece una prohibición absoluta de reembolsos ni exige renunciar a derechos legales.",
    "Para reclamar, contacta por el canal de WhatsApp indicado en la página, facilitando el identificador de pedido, fecha, descripción del inconveniente y comprobante de pago cuando exista."
  ]},
  {title:"6. Disponibilidad, entregas e imágenes", paragraphs:[
    "Las imágenes tienen fines ilustrativos. Los detalles artesanales pueden presentar variaciones razonables, sin alterar las características esenciales acordadas. La disponibilidad y la fecha solicitada requieren confirmación expresa.",
    "Los plazos, zonas de entrega y costos de traslado se acuerdan con el negocio. Cualquier cambio relevante de lo confirmado deberá informarse al cliente y gestionarse respetando sus derechos."
  ]},
  {title:"7. Privacidad de los datos", paragraphs:[
    "Para gestionar solicitudes se recaban nombre, teléfono, modalidad de recepción, dirección de entrega cuando corresponde, fecha deseada, productos e indicaciones que el cliente facilita voluntariamente. Esos datos se utilizan para procesar y dar seguimiento al pedido, comprobar su autenticidad, contactar al cliente y atender reclamaciones.",
    "La plataforma usa proveedores tecnológicos para alojamiento y almacenamiento, como Vercel y Firebase de Google, bajo accesos administrativos restringidos. El negocio no debe utilizar los datos de pedidos para campañas publicitarias ni compartirlos con terceros con fines comerciales sin la autorización que corresponda.",
    "El cliente puede solicitar acceso, corrección o eliminación de sus datos a través del contacto oficial indicado en la tienda, sujeto a las obligaciones de conservación aplicables. La información operativa se conserva durante el tiempo razonablemente necesario para atender los pedidos y las obligaciones pertinentes."
  ]},
  {title:"8. Legislación y contacto", paragraphs:[
    "Estas condiciones se interpretan conforme a la legislación de Nicaragua, incluida la Ley N.º 842 de protección de las personas consumidoras y usuarias y la Ley N.º 787 de protección de datos personales. Ninguna cláusula pretende excluir responsabilidades obligatorias del proveedor ni impedir reclamaciones ante las autoridades competentes.",
    "Las consultas de pedidos, pagos, correcciones y reclamaciones deben realizarse por el WhatsApp oficial publicado en la sección Redes de la tienda."
  ]},
];
export default function LegalPage(){
  return <main className="legal-page"><div className="legal-shell">
    <Link href="/" className="legal-back">← Volver a DOLCE</Link>
    <header className="legal-hero"><span className="legal-kicker">DOLCE · INFORMACIÓN AL CLIENTE</span><h1>Legales y <em>condiciones.</em></h1><p>Conoce cómo recibimos y confirmamos solicitudes, cómo se coordinan los pagos y qué ocurre con los cambios, cancelaciones y datos personales.</p><span className="legal-updated">Actualizado: 7 de noviembre de 2026 · Matagalpa, Nicaragua</span></header>
    <div className="legal-grid"><section className="legal-card legal-feature"><h2>Importante antes de pedir</h2><p>El formulario de DOLCE es una <strong>solicitud de pedido</strong>. No cobra en línea ni confirma automáticamente la venta. El propietario o su equipo se contactará primero por WhatsApp. Solo después podrán acordarse la transferencia o el pago en efectivo.</p></section>
    {sections.map(section=><section className="legal-card" key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}</div>
    <p className="legal-end">Estas condiciones describen el funcionamiento de DOLCE Digital y no sustituyen los derechos reconocidos por la ley. Para información comercial actualizada y reclamaciones, usa el canal oficial del negocio en <Link href="/#redes">Redes y contacto</Link>.</p>
    <div className="legal-credit">© DOLCE Repostería · Desarrollado por <a href="https://xarcon-creative.vercel.app/" target="_blank" rel="noopener noreferrer">XARCON</a></div>
  </div></main>;
}
