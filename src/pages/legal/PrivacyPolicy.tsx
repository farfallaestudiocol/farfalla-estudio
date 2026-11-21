import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveLegalInfo } from '@/lib/legal';
import { LegalLayout, Note, OL, P, Section, UL, TocItem } from '@/components/legal/LegalLayout';

const TOC: TocItem[] = [
  { id: 'responsable', title: 'Responsable del tratamiento' },
  { id: 'marco-legal', title: 'Marco legal' },
  { id: 'definiciones', title: 'Definiciones' },
  { id: 'datos', title: 'Qué datos recolectamos' },
  { id: 'finalidades', title: 'Para qué usamos los datos' },
  { id: 'autorizacion', title: 'Autorización' },
  { id: 'menores', title: 'Datos de niños, niñas y adolescentes' },
  { id: 'derechos', title: 'Tus derechos como titular' },
  { id: 'procedimiento', title: 'Cómo ejercer tus derechos' },
  { id: 'terceros', title: 'Con quién compartimos los datos' },
  { id: 'internacional', title: 'Transmisión y transferencia internacional' },
  { id: 'seguridad', title: 'Seguridad' },
  { id: 'conservacion', title: 'Conservación' },
  { id: 'cookies', title: 'Cookies y almacenamiento en tu navegador' },
  { id: 'correos', title: 'Rastreo de correos' },
  { id: 'rnbd', title: 'Registro Nacional de Bases de Datos' },
  { id: 'cambios', title: 'Cambios a esta política' },
];

/** Política de Tratamiento de Datos Personales (Ley 1581 de 2012 y Decreto 1377 de 2013). */
const PrivacyPolicy = () => {
  const { settings } = useSiteSettings();
  const info = resolveLegalInfo(settings);

  return (
    <LegalLayout
      path="/privacidad"
      title="Política de Tratamiento de Datos Personales"
      description={`Cómo ${info.brandName} recolecta, usa, protege y comparte tus datos personales, y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012.`}
      toc={TOC}
    >
      <P>
        En {info.brandName} respetamos tu privacidad. Esta política explica qué datos personales recolectamos cuando visitas la tienda,
        te registras o compras, para qué los usamos, con quién los compartimos y cómo puedes conocerlos, corregirlos o pedir que los eliminemos.
        La adoptamos en cumplimiento del artículo 15 de la Constitución Política, la Ley 1581 de 2012 y sus normas reglamentarias.
      </P>

      <Section id="responsable" title="1. Responsable del tratamiento">
        <P>El responsable del tratamiento de tus datos personales es:</P>
        <ul className="space-y-1">
          <li><strong>Nombre o razón social:</strong> {info.legalName}{info.legalName !== info.brandName ? ` (nombre comercial: ${info.brandName})` : ''}</li>
          {info.nit && <li><strong>NIT / documento:</strong> {info.nit}</li>}
          {info.address && <li><strong>Domicilio:</strong> {info.address}, {info.city}, Colombia</li>}
          {info.email && (
            <li>
              <strong>Correo para consultas y reclamos sobre datos personales:</strong>{' '}
              <a className="text-farfalla-teal hover:underline" href={`mailto:${info.email}`}>{info.email}</a>
            </li>
          )}
          {info.phone && <li><strong>Teléfono:</strong> {info.phone}</li>}
          <li><strong>Sitio web:</strong> {typeof window !== 'undefined' ? window.location.origin : ''}</li>
        </ul>
        <P>
          Las solicitudes relacionadas con datos personales son atendidas por el área de atención al cliente de {info.brandName}, por los canales indicados arriba.
        </P>
      </Section>

      <Section id="marco-legal" title="2. Marco legal">
        <UL>
          <li>Constitución Política de Colombia, artículos 15 (intimidad, buen nombre y habeas data) y 20 (acceso a la información).</li>
          <li>Ley 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales.</li>
          <li>Decreto 1377 de 2013, que reglamenta parcialmente la Ley 1581 de 2012 y está compilado en el Decreto Único Reglamentario 1074 de 2015.</li>
          <li>Las circulares y guías de la Superintendencia de Industria y Comercio (SIC), autoridad de protección de datos personales en Colombia.</li>
        </UL>
      </Section>

      <Section id="definiciones" title="3. Definiciones">
        <P>Usamos los términos de la Ley 1581 de 2012:</P>
        <UL>
          <li><strong>Titular:</strong> la persona natural cuyos datos personales son objeto de tratamiento. Eres tú.</li>
          <li><strong>Dato personal:</strong> cualquier información vinculada o que pueda asociarse a una persona natural determinada o determinable.</li>
          <li><strong>Tratamiento:</strong> cualquier operación sobre datos personales: recolección, almacenamiento, uso, circulación o supresión.</li>
          <li><strong>Responsable:</strong> quien decide sobre la base de datos y el tratamiento. En este caso, {info.legalName}.</li>
          <li><strong>Encargado:</strong> quien trata datos personales por cuenta del responsable (por ejemplo, los proveedores tecnológicos descritos más abajo).</li>
          <li><strong>Autorización:</strong> consentimiento previo, expreso e informado del titular para el tratamiento de sus datos.</li>
          <li><strong>Transmisión:</strong> comunicación de datos a un encargado, dentro o fuera de Colombia, para que los trate por cuenta del responsable.</li>
          <li><strong>Transferencia:</strong> envío de datos a un receptor que, a su vez, es responsable del tratamiento.</li>
        </UL>
      </Section>

      <Section id="datos" title="4. Qué datos recolectamos">
        <P><strong>Cuando compras (con o sin cuenta):</strong></P>
        <UL>
          <li>Nombre completo, correo electrónico y teléfono.</li>
          <li>Tipo y número de documento de identidad.</li>
          <li>Dirección de entrega: calle, ciudad, departamento y, si usas el buscador de direcciones, las coordenadas del lugar.</li>
          <li>Notas, textos y detalles de personalización que escribas para elaborar tu producto.</li>
          <li>La referencia de tu pago (el número de la transacción en Wompi) y el valor pagado.</li>
        </UL>
        <P><strong>Cuando creas una cuenta:</strong> los datos anteriores, más tu contraseña (que se almacena cifrada y no podemos ver), las direcciones que guardes, tus productos favoritos y tu carrito.</P>
        <P><strong>Cuando navegas:</strong> datos técnicos como dirección IP, tipo de navegador y dispositivo, páginas visitadas y duración de la visita, mediante herramientas de analítica (ver sección 14).</P>
        <P><strong>Cuando te escribimos o nos escribes:</strong> el registro de los correos que te enviamos y su estado (entregado, abierto, clic, rebotado), y los mensajes que envíes por correo, por WhatsApp o por el chat de la tienda, si está disponible.</P>
        <Note>
          No pedimos ni tratamos datos sensibles (salud, origen étnico, orientación política o religiosa, datos biométricos, entre otros). Te pedimos no incluirlos en los campos de notas o personalización.
          No almacenamos números de tarjeta ni claves bancarias: el pago lo procesa Wompi, en su propia plataforma.
        </Note>
      </Section>

      <Section id="finalidades" title="5. Para qué usamos tus datos">
        <OL>
          <li>Gestionar tu compra: validar el pedido, elaborar los productos, preparar el envío y entregarlos.</li>
          <li>Confirmar tu pago y registrar la transacción a través de Wompi.</li>
          <li>Enviarte comunicaciones sobre tu pedido: confirmación, preparación, despacho y entrega, y permitirte consultar su estado.</li>
          <li>Atender tus consultas, peticiones, quejas y reclamos, y gestionar garantías, cambios, devoluciones y reversiones de pago.</li>
          <li>Cumplir obligaciones legales: contables, tributarias, de facturación y requerimientos de autoridades competentes.</li>
          <li>Prevenir fraudes y proteger la seguridad de la tienda y de nuestros clientes.</li>
          <li>Mejorar el sitio y la experiencia de compra mediante estadísticas de uso.</li>
          <li>Responder tus mensajes por los canales de atención (correo, WhatsApp y chat).</li>
        </OL>
        <Note>
          <strong>No enviamos publicidad ni ofertas</strong> sin tu autorización previa, expresa y separada de esta, y no vendemos tus datos.
          Si en el futuro ofrecemos boletines o promociones, podrás aceptarlos o no de forma independiente a tu compra y retirar tu consentimiento cuando quieras.
        </Note>
      </Section>

      <Section id="autorizacion" title="6. Autorización">
        <P>
          Tratamos tus datos con tu autorización previa, expresa e informada. La obtenemos mediante una casilla que marcas al finalizar una compra o al crear una cuenta,
          después de poder leer esta política. Marcarla es una conducta que nos permite concluir de forma inequívoca que aceptas el tratamiento descrito.
        </P>
        <P>
          Como la ley nos exige poder demostrar que contamos con tu autorización, guardamos la fecha y la versión de esta política que aceptaste.
          Puedes revocar tu autorización o pedir la supresión de tus datos en cualquier momento, salvo cuando tengas un deber legal o contractual de permanecer en nuestras bases
          (por ejemplo, la conservación de la información de una compra por obligaciones contables y tributarias).
        </P>
        <P>
          También tratamos datos sin autorización cuando la ley lo permite, por ejemplo, cuando una autoridad en ejercicio de sus funciones legales o una orden judicial lo requiera.
        </P>
      </Section>

      <Section id="menores" title="7. Datos de niños, niñas y adolescentes">
        <P>
          La tienda está dirigida a personas mayores de edad. Muchos de nuestros productos son para niños, y para elaborarlos puede ser necesario que escribas el nombre de un menor
          u otros detalles de personalización.
        </P>
        <P>
          Si incluyes datos de un menor, declaras que eres su representante legal o que cuentas con la autorización de este. Usamos esos datos únicamente para elaborar el producto que pediste,
          los tratamos con respeto al interés superior del menor y a sus derechos fundamentales, y no los usamos para ningún otro fin, en línea con el artículo 7 de la Ley 1581 de 2012.
          Si crees que un menor nos entregó datos sin la autorización de su representante, escríbenos para eliminarlos.
        </P>
      </Section>

      <Section id="derechos" title="8. Tus derechos como titular">
        <P>De acuerdo con el artículo 8 de la Ley 1581 de 2012, tienes derecho a:</P>
        <UL>
          <li>Conocer, actualizar y rectificar tus datos personales frente a nosotros o a los encargados del tratamiento.</li>
          <li>Solicitar prueba de la autorización que nos diste.</li>
          <li>Ser informado, previa solicitud, del uso que se ha dado a tus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</li>
          <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales, o cuando la SIC así lo determine.</li>
          <li>Acceder de forma gratuita a tus datos personales que hayan sido objeto de tratamiento, al menos una vez cada mes calendario y cada vez que existan modificaciones sustanciales a esta política.</li>
        </UL>
      </Section>

      <Section id="procedimiento" title="9. Cómo ejercer tus derechos">
        <P>
          Escríbenos a{' '}
          {info.email ? <a className="text-farfalla-teal hover:underline" href={`mailto:${info.email}`}>{info.email}</a> : 'nuestro correo de contacto'}
          {info.phone ? <> o comunícate al {info.phone}</> : null}
          {info.address ? <>, o envía una comunicación escrita a {info.address}, {info.city}</> : null}. Tu solicitud debe incluir:
        </P>
        <UL>
          <li>Tu nombre e identificación (y la del representante o apoderado, si actúa en tu nombre).</li>
          <li>La descripción de lo que solicitas (consulta, actualización, rectificación, supresión o revocatoria) y de los hechos que la motivan.</li>
          <li>Una dirección de correo o física para responderte, y los documentos que quieras hacer valer.</li>
        </UL>
        <P>Pueden presentar la solicitud el titular, sus causahabientes, su representante o apoderado, o quien haya hecho una estipulación a favor suyo.</P>
        <P><strong>Consultas.</strong> Las responderemos en un máximo de diez (10) días hábiles desde su recibo. Si no podemos hacerlo en ese plazo, te avisaremos los motivos y la nueva fecha, que no superará cinco (5) días hábiles adicionales.</P>
        <P>
          <strong>Reclamos</strong> (para corregir, actualizar, suprimir o por presunto incumplimiento). Los responderemos en un máximo de quince (15) días hábiles desde su recibo completo.
          Si faltan datos, te pediremos subsanarlos dentro de los cinco (5) días siguientes; si pasan dos (2) meses sin que lo hagas, entenderemos que desististe.
          Si no podemos resolver en ese plazo, te informaremos los motivos y la fecha de respuesta, que no superará ocho (8) días hábiles adicionales.
        </P>
        <Note>
          Solo puedes acudir a la Superintendencia de Industria y Comercio (<a className="text-farfalla-teal hover:underline" href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer">www.sic.gov.co</a>)
          después de haber agotado este trámite con nosotros.
        </Note>
      </Section>

      <Section id="terceros" title="10. Con quién compartimos los datos">
        <P>
          No vendemos tus datos. Los compartimos solo con proveedores que nos ayudan a prestar el servicio y que los tratan por nuestra cuenta, como encargados, únicamente para las finalidades descritas:
        </P>
        <UL>
          <li><strong>Wompi</strong>, pasarela de pagos: procesa tu pago. Recibe los datos necesarios para la transacción, bajo sus propios términos y política de privacidad.</li>
          <li><strong>Supabase</strong>: infraestructura donde se aloja la base de datos y la autenticación de la tienda.</li>
          <li><strong>Google</strong>: autocompletado de direcciones (Google Places), analítica del sitio (Google Analytics) y almacenamiento de las imágenes del catálogo (Google Drive, que no contiene datos de clientes).</li>
          <li><strong>Fácil Correo</strong>: envío de los correos sobre tu pedido y su seguimiento de entrega y apertura. Si el chat de la tienda está activo, también atiende las conversaciones del chat.</li>
          <li><strong>Empresas de transporte y mensajería</strong>: reciben tu nombre, teléfono y dirección para entregarte el pedido.</li>
          <li><strong>WhatsApp (Meta)</strong>, si nos escribes por ese canal.</li>
          <li><strong>Autoridades</strong>, cuando una norma o una orden de autoridad competente lo exija.</li>
        </UL>
      </Section>

      <Section id="internacional" title="11. Transmisión y transferencia internacional">
        <P>
          Algunos de estos proveedores almacenan o procesan datos en servidores ubicados fuera de Colombia, incluido Estados Unidos. Estas transmisiones las hacemos a encargados
          que se obligan a proteger los datos y a tratarlos solo siguiendo nuestras instrucciones, en los términos de la Ley 1581 de 2012 y su reglamentación.
          No transferimos tus datos a terceros fuera de Colombia para que los usen con fines propios sin cumplir los requisitos del artículo 26 de la ley.
        </P>
      </Section>

      <Section id="seguridad" title="12. Seguridad">
        <P>Aplicamos medidas razonables para proteger tus datos contra pérdida, acceso o uso no autorizado, entre ellas:</P>
        <UL>
          <li>Conexión cifrada (HTTPS) entre tu navegador y la tienda.</li>
          <li>Contraseñas almacenadas de forma cifrada.</li>
          <li>Control de acceso por roles: solo el personal autorizado de {info.brandName} puede ver los pedidos, y cada cliente solo ve los suyos.</li>
          <li>Credenciales de los proveedores guardadas de forma restringida, sin exposición en el navegador.</li>
          <li>Verificación del pago directamente con Wompi antes de confirmar un pedido, y enlaces de seguimiento con código único para los pedidos sin cuenta.</li>
        </UL>
        <P>
          Ningún sistema es infalible. Si llegamos a conocer un incidente de seguridad que afecte tus datos, actuaremos conforme a la ley, incluido informar a la Superintendencia de Industria y Comercio cuando corresponda.
        </P>
      </Section>

      <Section id="conservacion" title="13. Conservación">
        <P>
          Conservamos tus datos mientras sean necesarios para las finalidades de esta política y durante los plazos que exigen las normas comerciales, contables y tributarias colombianas
          para la información de las compras. Cuando dejen de ser necesarios, los eliminamos o los anonimizamos. Si tienes una cuenta, puedes pedirnos cerrarla y eliminar los datos que no estemos obligados a conservar.
        </P>
        <P>
          Nuestros proveedores aplican sus propios plazos de conservación para los registros técnicos y los correos, que son limitados.
        </P>
      </Section>

      <Section id="cookies" title="14. Cookies y almacenamiento en tu navegador">
        <P>La tienda usa tecnologías de almacenamiento en tu navegador para funcionar y para medir el uso del sitio:</P>
        <UL>
          <li><strong>Esenciales:</strong> mantener tu sesión si tienes cuenta, recordar tu carrito de compras si no has iniciado sesión y conservar temporalmente los datos de tu pedido mientras pagas.</li>
          <li><strong>Preferencias:</strong> recordar ajustes de la interfaz y guardar en caché el logo para que el sitio cargue más rápido.</li>
          <li><strong>Analítica:</strong> usamos Google Analytics para saber cuántas personas visitan el sitio y cómo lo usan, mediante identificadores y datos técnicos. Puedes evitarlo con el complemento de inhabilitación de Google Analytics
            (<a className="text-farfalla-teal hover:underline" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">tools.google.com/dlpage/gaoptout</a>)
            o desde la configuración de tu navegador.</li>
        </UL>
        <P>Puedes borrar estos datos o bloquearlos desde tu navegador; si bloqueas los esenciales, partes de la tienda (como el carrito) dejarán de funcionar.</P>
      </Section>

      <Section id="correos" title="15. Rastreo de correos">
        <P>
          Los correos sobre tu pedido pueden incluir un mecanismo que nos permite saber si fueron entregados, abiertos o si hiciste clic en un enlace.
          Lo usamos para confirmar que recibiste la información de tu compra y para detectar direcciones de correo inválidas, no para elaborar perfiles comerciales.
          Puedes impedir el registro de aperturas bloqueando la carga de imágenes remotas en tu programa de correo.
        </P>
      </Section>

      <Section id="rnbd" title="16. Registro Nacional de Bases de Datos">
        <P>
          Cuando la normativa lo exija, {info.legalName} inscribirá sus bases de datos en el Registro Nacional de Bases de Datos (RNBD) administrado por la Superintendencia de Industria y Comercio.
        </P>
      </Section>

      <Section id="cambios" title="17. Cambios a esta política">
        <P>
          Podemos actualizar esta política para reflejar cambios en la ley o en la forma en que operamos la tienda. Publicaremos la versión vigente en esta página con su fecha.
          Si el cambio es sustancial, te lo informaremos por la tienda o por correo electrónico antes de aplicarlo. Esta es la versión vigente; las anteriores se conservan para poder acreditar la autorización que cada titular dio.
        </P>
        <P>
          Consulta también nuestros <Link className="text-farfalla-teal hover:underline" to="/terminos">Términos y Condiciones</Link>.
        </P>
      </Section>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
