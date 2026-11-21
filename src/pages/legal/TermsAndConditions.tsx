import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveLegalInfo } from '@/lib/legal';
import { LegalLayout, Note, OL, P, Section, UL, TocItem } from '@/components/legal/LegalLayout';

const TOC: TocItem[] = [
  { id: 'proveedor', title: 'Quiénes somos y aceptación' },
  { id: 'uso', title: 'Uso del sitio y cuentas' },
  { id: 'productos', title: 'Productos y personalización' },
  { id: 'precios', title: 'Precios, impuestos y moneda' },
  { id: 'compra', title: 'Proceso de compra' },
  { id: 'pago', title: 'Pago' },
  { id: 'envio', title: 'Envío y entrega' },
  { id: 'cancelaciones', title: 'Cancelaciones' },
  { id: 'retracto', title: 'Derecho de retracto' },
  { id: 'garantia', title: 'Garantía y productos defectuosos' },
  { id: 'devoluciones', title: 'Devoluciones y reembolsos' },
  { id: 'reversion', title: 'Reversión del pago' },
  { id: 'propiedad', title: 'Propiedad intelectual y tu contenido' },
  { id: 'conductas', title: 'Conductas no permitidas' },
  { id: 'chat', title: 'Chat, asistente virtual y comunicaciones' },
  { id: 'responsabilidad', title: 'Limitación de responsabilidad' },
  { id: 'pqrs', title: 'Atención al consumidor' },
  { id: 'ley', title: 'Ley aplicable y autoridad' },
  { id: 'cambios', title: 'Cambios a estos términos' },
];

/** Términos y Condiciones de uso y compra (Ley 1480 de 2011, Ley 527 de 1999). */
const TermsAndConditions = () => {
  const { settings } = useSiteSettings();
  const info = resolveLegalInfo(settings);
  const contact = info.email ? (
    <a className="text-farfalla-teal hover:underline" href={`mailto:${info.email}`}>{info.email}</a>
  ) : (
    'nuestros canales de atención'
  );

  return (
    <LegalLayout
      path="/terminos"
      title="Términos y Condiciones de Uso y Compra"
      description={`Condiciones para usar la tienda y comprar en ${info.brandName}: precios, pagos, envíos, retracto, garantía y atención al consumidor, conforme a la ley colombiana.`}
      toc={TOC}
    >
      <Section id="proveedor" title="1. Quiénes somos y aceptación">
        <P>
          Estos términos regulan el uso de la tienda en línea y las compras que realices en ella. La tienda es operada por{' '}
          <strong>{info.legalName}</strong>{info.legalName !== info.brandName ? ` (${info.brandName})` : ''}
          {info.nit ? `, NIT ${info.nit}` : ''}
          {info.address ? `, con domicilio en ${info.address}, ${info.city}, Colombia` : ''}. Puedes contactarnos en {contact}
          {info.phone ? ` o al ${info.phone}` : ''}.
        </P>
        <P>
          Al marcar la casilla de aceptación al comprar o al crear una cuenta, manifiestas que leíste y aceptas estos términos. Esa aceptación por medios electrónicos tiene plena validez
          conforme a la Ley 527 de 1999 sobre comercio electrónico. Necesitas ser mayor de edad y tener capacidad legal para contratar. Si eres menor, solo un adulto responsable puede comprar en tu nombre.
        </P>
        <P>
          El tratamiento de tus datos personales se rige por nuestra <Link className="text-farfalla-teal hover:underline" to="/privacidad">Política de Tratamiento de Datos Personales</Link>.
        </P>
      </Section>

      <Section id="uso" title="2. Uso del sitio y cuentas">
        <UL>
          <li>Puedes comprar con o sin cuenta. Crear una cuenta es opcional y te permite guardar direcciones, favoritos y ver el historial de tus pedidos.</li>
          <li>Debes dar datos verdaderos, completos y actualizados. Eres responsable de que el correo, el teléfono y la dirección de entrega sean correctos.</li>
          <li>Si creas una cuenta, eres responsable de mantener la confidencialidad de tu contraseña y de la actividad que ocurra con ella. Avísanos de inmediato si sospechas un uso no autorizado.</li>
          <li>Puedes dejar de usar el sitio o pedir el cierre de tu cuenta cuando quieras.</li>
        </UL>
      </Section>

      <Section id="productos" title="3. Productos y personalización">
        <P>
          Describimos y mostramos los productos de la forma más precisa posible. Las fotografías son referenciales: pueden existir pequeñas diferencias de color, tamaño o acabado por la pantalla,
          la iluminación o la elaboración artesanal.
        </P>
        <P>
          Muchos productos se elaboran a tu medida con los textos, nombres, fechas y demás detalles que escribas. Por eso:
        </P>
        <UL>
          <li>Eres responsable de la exactitud de lo que escribas (ortografía, nombres, fechas, datos). Elaboraremos el producto con la información tal como la enviaste.</li>
          <li>Puedes escribirnos para corregir un dato mientras tu pedido no haya entrado en producción.</li>
          <li>Nos reservamos el derecho de no elaborar contenidos que infrinjan la ley o derechos de terceros (ver sección 14), caso en el cual te reembolsaremos lo pagado.</li>
        </UL>
      </Section>

      <Section id="precios" title="4. Precios, impuestos y moneda">
        <P>
          Los precios están expresados en pesos colombianos (COP). Antes de pagar ves el valor total de tu pedido, discriminado en productos, costo de envío e impuestos cuando apliquen.
          Ese valor es el que se te cobra.
        </P>
        <P>
          Si detectamos un error manifiesto en un precio publicado, te contactaremos antes de elaborar el pedido para que decidas si lo confirmas con el precio correcto o lo cancelas con reembolso total.
        </P>
      </Section>

      <Section id="compra" title="5. Proceso de compra">
        <OL>
          <li>Agregas productos al carrito e indicas los detalles de personalización que necesites.</li>
          <li>Ingresas tus datos, la dirección de entrega y aceptas estos términos y la política de datos personales.</li>
          <li>Pagas a través de Wompi.</li>
          <li>Cuando el pago es aprobado, tu pedido queda registrado y te enviamos un correo de confirmación con el número del pedido y un enlace para consultar su estado, incluso si no tienes cuenta.</li>
        </OL>
        <P>
          El contrato de compraventa se perfecciona cuando tu pago es aprobado y el pedido queda registrado. Un pago rechazado o pendiente no genera un pedido. Guarda el correo de confirmación: es tu constancia de la compra.
        </P>
      </Section>

      <Section id="pago" title="6. Pago">
        <P>
          Los pagos se procesan a través de <strong>Wompi</strong>, con los medios que ofrezca en cada momento (por ejemplo, tarjetas de crédito y débito y PSE). {info.brandName} no recibe ni almacena los datos de tu tarjeta ni tus claves bancarias.
          Wompi y tu entidad financiera pueden verificar la operación y aplicar sus propios controles antifraude. Los costos o cobros de tu entidad financiera son ajenos a nosotros.
        </P>
        <P>
          Confirmamos el pago directamente con Wompi antes de registrar el pedido. Si tu pago fue aprobado pero no recibes la confirmación del pedido, escríbenos con el número de la transacción para ayudarte.
        </P>
      </Section>

      <Section id="envio" title="7. Envío y entrega">
        <UL>
          <li>Hacemos envíos dentro de Colombia a la dirección que indiques. Verifica que sea correcta y completa, y que alguien pueda recibir el pedido.</li>
          <li>El costo de envío depende de la ciudad de destino y de las condiciones vigentes (por ejemplo, envío gratis a partir de un valor de compra, cuando esté disponible). Lo ves en el carrito antes de pagar.</li>
          <li>El plazo de entrega incluye el tiempo de elaboración de los productos personalizados y el de transporte. Te informamos el plazo estimado en la página del producto o en la confirmación del pedido. Si no se acordó un plazo, entregaremos a más tardar en treinta (30) días calendario desde tu pedido, conforme al Estatuto del Consumidor.</li>
          <li>Si no es posible entregarte por datos incorrectos o ausencia de quien reciba, nos pondremos en contacto contigo; los costos adicionales de un nuevo intento, si los hay, serán informados antes de cobrarlos.</li>
          <li>Revisa el paquete al recibirlo y, si notas daños, avísanos lo antes posible con fotos.</li>
        </UL>
      </Section>

      <Section id="cancelaciones" title="8. Cancelaciones">
        <P>
          Puedes pedir la cancelación de tu pedido escribiéndonos con tu número de pedido. Si todavía no ha entrado en producción, lo cancelamos y te reembolsamos el valor pagado.
          Si la elaboración ya comenzó, el producto personalizado no puede cancelarse, porque se confecciona con tus especificaciones (ver sección 9).
        </P>
      </Section>

      <Section id="retracto" title="9. Derecho de retracto">
        <P>
          En las compras a distancia, el artículo 47 de la Ley 1480 de 2011 te permite retractarte de la compra dentro de los cinco (5) días hábiles siguientes a la entrega del producto, sin necesidad de dar explicaciones.
          Para ejercerlo, escríbenos a {contact} indicando tu número de pedido.
        </P>
        <UL>
          <li>Debes devolver el producto sin uso, en su empaque y con sus accesorios. Los costos de transporte de la devolución están a tu cargo.</li>
          <li>Una vez ejercido el retracto y recibido el producto, te devolvemos el dinero dentro de los treinta (30) días calendario siguientes, por el mismo medio de pago que usaste.</li>
        </UL>
        <Note>
          <strong>Excepciones.</strong> La ley excluye el retracto, entre otros casos, de los bienes confeccionados conforme a las especificaciones que da el consumidor o claramente personalizados,
          de los que por su naturaleza no pueden devolverse y de los que pueden deteriorarse o caducar con rapidez. Por eso, <strong>los productos personalizados no tienen derecho de retracto</strong>.
          Los productos estándar del catálogo, sin personalización, sí lo tienen.
        </Note>
      </Section>

      <Section id="garantia" title="10. Garantía y productos defectuosos">
        <P>
          Todos nuestros productos cuentan con la garantía legal de la Ley 1480 de 2011. Si recibes un producto con un defecto de calidad o de elaboración, que está dañado,
          o que no corresponde a lo que pediste, escríbenos a {contact} con tu número de pedido y fotografías. Según el caso, lo repararemos, lo reemplazaremos o te devolveremos el dinero,
          y asumiremos los costos de envío de ese trámite.
        </P>
        <P>
          La garantía no cubre errores en los datos que tú escribiste para la personalización, el desgaste normal, el uso inadecuado ni los daños posteriores a la entrega causados por mal manejo.
        </P>
      </Section>

      <Section id="devoluciones" title="11. Devoluciones y reembolsos">
        <P>
          Los reembolsos se hacen por el mismo medio de pago utilizado en la compra, a través de Wompi o de tu entidad financiera. El tiempo en que el dinero aparezca en tu cuenta depende de esa entidad.
          Antes de devolver cualquier producto, contáctanos para indicarte cómo hacerlo; así evitamos que se pierda o que no podamos identificarlo.
        </P>
      </Section>

      <Section id="reversion" title="12. Reversión del pago">
        <P>
          En las compras por medios electrónicos puedes solicitar la reversión del pago, conforme al artículo 51 de la Ley 1480 de 2011 y el Decreto 587 de 2016, cuando:
        </P>
        <UL>
          <li>Hayas sido víctima de fraude.</li>
          <li>La operación haya sido no solicitada.</li>
          <li>No hayas recibido el producto.</li>
          <li>El producto recibido no corresponda a lo solicitado o no cumpla las condiciones ofrecidas.</li>
          <li>El producto entregado sea defectuoso.</li>
        </UL>
        <P>
          La solicitud se presenta ante tu entidad financiera (la que emitió tu tarjeta o cuenta) dentro de los cinco (5) días hábiles siguientes a que tengas noticia del hecho. Nosotros colaboraremos con la información que se requiera.
          Te recomendamos escribirnos primero: muchas veces podemos resolverlo más rápido.
        </P>
      </Section>

      <Section id="propiedad" title="13. Propiedad intelectual y tu contenido">
        <P>
          Los diseños, ilustraciones, marcas, logotipos, textos, fotografías y demás contenidos de la tienda pertenecen a {info.brandName} o a quienes nos los licencian, y están protegidos por las normas de propiedad intelectual.
          No puedes copiarlos, reproducirlos ni usarlos comercialmente sin nuestra autorización escrita.
        </P>
        <P>
          Los textos, nombres, imágenes u otros contenidos que nos envíes para personalizar un producto siguen siendo tuyos. Nos autorizas a usarlos únicamente para elaborar y entregar tu pedido.
          Declaras que tienes derecho a usarlos y que no infringen derechos de terceros. No los usaremos con fines publicitarios sin tu autorización.
        </P>
      </Section>

      <Section id="conductas" title="14. Conductas no permitidas">
        <UL>
          <li>Suministrar datos falsos o suplantar a otra persona, o usar medios de pago sin ser su titular.</li>
          <li>Enviar contenidos de personalización ilegales, ofensivos, discriminatorios, que vulneren derechos de menores o que infrinjan derechos de autor, marcas o personajes protegidos de terceros.</li>
          <li>Intentar acceder sin autorización a la tienda, a cuentas de otras personas o a la información de los pedidos, o alterar su funcionamiento.</li>
          <li>Usar programas automáticos para extraer contenidos o sobrecargar el sitio.</li>
        </UL>
        <P>
          Podemos rechazar un pedido, suspender una cuenta o cancelar una compra con reembolso cuando detectemos alguna de estas conductas, sin perjuicio de las acciones legales que correspondan.
        </P>
      </Section>

      <Section id="chat" title="15. Chat, asistente virtual y comunicaciones">
        <P>
          Si la tienda ofrece un chat con asistente virtual de inteligencia artificial, sus respuestas son informativas y automáticas: pueden contener errores y no reemplazan la información publicada en el sitio.
          Los precios, plazos y condiciones que valen son los que ves en el carrito y en la confirmación de tu pedido. No escribas en el chat datos sensibles ni claves. Puedes pedir que te atienda una persona.
          Las conversaciones se tratan conforme a la Política de Tratamiento de Datos Personales.
        </P>
        <P>
          Te enviaremos por correo la información de tu pedido (confirmación y cambios de estado). No te enviaremos publicidad sin tu autorización aparte.
        </P>
      </Section>

      <Section id="responsabilidad" title="16. Limitación de responsabilidad">
        <P>
          Hacemos lo razonable para que la tienda esté disponible y libre de errores, pero no garantizamos que funcione de forma ininterrumpida; puede haber interrupciones por mantenimiento, fallas de terceros o fuerza mayor.
          No somos responsables por los retrasos o fallos atribuibles a proveedores externos (por ejemplo, la pasarela de pagos, las empresas de transporte o tu proveedor de internet) en los términos que permite la ley.
        </P>
        <Note>
          Nada de lo dispuesto aquí limita los derechos irrenunciables que la ley reconoce a los consumidores ni nuestra responsabilidad por los daños que la ley no permite excluir.
        </Note>
      </Section>

      <Section id="pqrs" title="17. Atención al consumidor">
        <P>
          Para peticiones, quejas, reclamos y sugerencias, escríbenos a {contact}
          {info.phone ? <> o llámanos al {info.phone}</> : null}
          {info.address ? <>, o escríbenos a {info.address}, {info.city}</> : null}. Incluye tu número de pedido y los datos necesarios para ayudarte.
          Responderemos en el menor tiempo posible y, en todo caso, dentro de los quince (15) días hábiles siguientes a su recibo.
        </P>
      </Section>

      <Section id="ley" title="18. Ley aplicable y autoridad">
        <P>
          Estos términos se rigen por las leyes de la República de Colombia, en especial la Ley 1480 de 2011 (Estatuto del Consumidor), la Ley 527 de 1999 (comercio electrónico) y la Ley 1581 de 2012 (protección de datos personales).
          Si no logramos resolver una diferencia directamente, puedes acudir a la Superintendencia de Industria y Comercio (
          <a className="text-farfalla-teal hover:underline" href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer">www.sic.gov.co</a>) o a los jueces competentes de Colombia.
        </P>
      </Section>

      <Section id="cambios" title="19. Cambios a estos términos">
        <P>
          Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con su fecha. Los cambios se aplican a las compras que hagas después de su publicación; tu compra se rige por los términos vigentes cuando la hiciste.
        </P>
      </Section>
    </LegalLayout>
  );
};

export default TermsAndConditions;
