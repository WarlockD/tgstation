import { Fragment } from 'inferno';
import { useBackend, log } from '../backend';
import { Section, BackgroundSound } from '../components';
import { Window } from '../layouts';
import { createLogger } from './../logging';

const logger = createLogger('audio');

const base64toBlob = (base64Data, contentType) => {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      var begin = sliceIndex * sliceSize;
      var end = Math.min(begin + sliceSize, bytesLength);

      var bytes = new Array(end - begin);
      for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}


export const StationAlertConsole = () => {
  const blob_co="data:audio/midi"; /// data:audio/midi;base64,
  const blob_64="TVRoZAAAAAYAAQACAIBNVHJrAAADoQDAAQCQRn+CAIBGfwCQRn9AgEZ/AJBBf0CAQX8AkEF/QIBBfwCQRn9AgEZ/AJBEfyCARH8AkEJ/IIBCfwCQRH+DAIBEf0CQRn+CAIBGfwCQRn9AgEZ/AJBBf0CAQX8AkEF/QIBBfwCQRn9AgEZ/AJBFfyCARX8AkEN/IIBDfwCQRX+BQIBFf4IAkEUBhACARQGEAJBGf4EAgEZ/AJBBf4FAgEF/AJBGf0CARn8AkEZ/IIBGfwCQSH8ggEh/AJBKfyCASn8AkEt/IIBLfwCQTX+CAIBNf0CQTX9AgE1/AJBNf0CATX8AkE5/IIBOfwCQUH8ggFB/AJBSf4IAgFJ/QJBSf0CAUn8AkFJ/QIBSfwCQUH8ggFB/AJBOfyCATn8AkFB/YIBQfwCQTn8ggE5/AJBNf4IAgE1/AJBNf4EAgE1/AJBLf2CAS38AkE1/IIBNfwCQTn+CAIBOfwCQTX9AgE1/AJBLf0CAS38AkEl/YIBJfwCQS38ggEt/AJBNf4IAgE1/AJBLf0CAS38AkEl/QIBJfwCQSH9ggEh/AJBKfyCASn8AkEx/ggCATH8AkE9/gQCAT38AkE1/QIBNfwCQQX8ggEF/AJBBfyCAQX8AkEF/QIBBfwCQQX8ggEF/AJBBfyCAQX8AkEF/QIBBfwCQQX8ggEF/AJBBfyCAQX8AkEF/QIBBfwCQQX9AgEF/AJBGf4EAgEZ/AJBBf4FAgEF/AJBGf0CARn8AkEZ/IIBGfwCQSH8ggEh/AJBKfyCASn8AkEt/IIBLfwCQTX+CAIBNf0CQTX9AgE1/AJBNf0CATX8AkE5/IIBOfwCQUH8ggFB/AJBSf4MAgFJ/AJBVf4EAgFV/AJBUf4EAgFR/AJBRf4IAgFF/AJBNf4EAgE1/AJBOf4MAgE5/AJBSf4EAgFJ/AJBRf4EAgFF/AJBNf4IAgE1/AJBNf4EAgE1/AJBOf4MAgE5/AJBSf4EAgFJ/AJBRf4EAgFF/AJBNf4IAgE1/AJBKf4EAgEp/AJBLf4MAgEt/AJBOf4EAgE5/AJBNf4EAgE1/AJBJf4IAgEl/AJBGf4EAgEZ/AJBIf2CASH8AkEp/IIBKfwCQTH+CAIBMfwCQT3+BAIBPfwCQTX9AgE1/AJBBfyCAQX8AkEF/IIBBfwCQQX9AgEF/AJBBfyCAQX8AkEF/IIBBfwCQQX9AgEF/AJBBfyCAQX8AkEF/IIBBfwCQQX9AgEF/AJBBf0CAQX8A/y8ATVRyawAACUMAwAEAkCpAgQCAKkAAkDVAgQCANUAAkDpAggCAOkAAkClAgQCAKUAAkDNAgQCAM0AAkDhAggCAOEAAkCdAgQCAJ0AAkDFAgQCAMUAAkDpAggCAOkAAkCpAgQCAKkAAkDVAgQCANUAAkDpAggCAOkAAkC5AQIAuQACQLkAggC5AAJApQCCAKUAAkC5AQIAuQACQLkAggC5AAJApQCCAKUAAkC5AQIAuQACQLkAggC5AAJApQCCAKUAAkC5AIIAuQACQKUAggClAAJAuQCCALkAAkClAIIApQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkAggC5AAJApQCCAKUAAkC5AIIAuQACQKUAggClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQCCALkAAkClAIIApQACQLkAggC5AAJApQCCAKUAAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAIIAsQACQJ0AggCdAAJAsQCCALEAAkCdAIIAnQACQKkBAgCpAAJAqQCCAKkAAkCVAIIAlQACQKkBAgCpAAJAqQCCAKkAAkCVAIIAlQACQKkBAgCpAAJAqQCCAKkAAkCVAIIAlQACQKkAggCpAAJAlQCCAJUAAkCpAIIAqQACQJUAggCVAAJAxQECAMUAAkDFAIIAxQACQLEAggCxAAJAxQECAMUAAkDFAIIAxQACQLEAggCxAAJAxQECAMUAAkDFAIIAxQACQLEAggCxAAJAxQCCAMUAAkCxAIIAsQACQMUAggDFAAJAsQCCALEAAkC9AQIAvQACQL0AggC9AAJAqQCCAKkAAkC9AQIAvQACQL0AggC9AAJAqQCCAKkAAkC9AQIAvQACQL0AggC9AAJAqQCCAKkAAkC9AIIAvQACQKkAggCpAAJAvQCCAL0AAkCpAIIAqQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkBAgC5AAJAuQCCALkAAkClAIIApQACQLkAggC5AAJApQCCAKUAAkC5AIIAuQACQKUAggClAAJAwQECAMEAAkDBAIIAwQACQK0AggCtAAJAwQECAMEAAkDBAIIAwQACQK0AggCtAAJAwQECAMEAAkDBAIIAwQACQK0AggCtAAJAwQCCAMEAAkCtAIIArQACQMEAggDBAAJArQCCAK0AAkClAQIApQACQOUAggDlAAJA5QCCAOUAAkDhAQIA4QACQOEAggDhAAJA4QCCAOEAAkDdAQIA3QACQN0AggDdAAJA3QCCAN0AAkDZAQIA2QACQKUBAgClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQECALkAAkC5AIIAuQACQKUAggClAAJAuQCCALkAAkClAIIApQACQLkAggC5AAJApQCCAKUAAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAQIAsQACQLEAggCxAAJAnQCCAJ0AAkCxAIIAsQACQJ0AggCdAAJAsQCCALEAAkCdAIIAnQACQKkBAgCpAAJAqQCCAKkAAkCpAIIAqQACQKkBAgCpAAJAqQCCAKkAAkCpAIIAqQACQKkBAgCpAAJAqQCCAKkAAkCpAIIAqQACQKkAggCpAAJAqQCCAKkAAkCpAIIAqQACQKkAggCpAAJApQECAKUAAkClAIIApQACQKUAggClAAJApQECAKUAAkClAIIApQACQKUAggClAAJApQECAKUAAkClAIIApQACQKUAggClAAJApQCCAKUAAkClAIIApQACQKUAggClAAJApQCCAKUAAkChAQIAoQACQKEAggChAAJAoQCCAKEAAkChAQIAoQACQKEAggChAAJAoQCCAKEAAkChAQIAoQACQKEAggChAAJAoQCCAKEAAkChAIIAoQACQKEAggChAAJAoQCCAKEAAkChAIIAoQACQKUBAgClAAJApQCCAKUAAkClAIIApQACQKUBAgClAAJApQCCAKUAAkClAIIApQACQKUBAgClAAJApQCCAKUAAkClAIIApQACQKUAggClAAJApQCCAKUAAkClAIIApQACQKUAggClAAJAoQECAKEAAkChAIIAoQACQKEAggChAAJAoQECAKEAAkChAIIAoQACQKEAggChAAJAoQECAKEAAkChAIIAoQACQKEAggChAAJAoQCCAKEAAkChAIIAoQACQKEAggChAAJAoQCCAKEAAkClAQIApQACQKUAggClAAJApQCCAKUAAkClAQIApQACQKUAggClAAJApQCCAKUAAkClAQIApQACQKUAggClAAJApQCCAKUAAkClAIIApQACQKUAggClAAJApQCCAKUAAkClAIIApQACQL0BAgC9AAJAvQCCAL0AAkC9AIIAvQACQL0BAgC9AAJAvQCCAL0AAkC9AIIAvQACQL0BAgC9AAJAvQCCAL0AAkC9AIIAvQACQL0AggC9AAJAvQCCAL0AAkC9AIIAvQACQL0AggC9AAJAuQECALkAAkC5AIIAuQACQLkAggC5AAJAuQECALkAAkC5AIIAuQACQLkAggC5AAJAuQECALkAAkC5AIIAuQACQLkAggC5AAJAuQCCALkAAkC5AIIAuQACQLkAggC5AAJAuQCCALkAAkDBAQIAwQACQMEAggDBAAJAwQCCAMEAAkDBAQIAwQACQMEAggDBAAJAwQCCAMEAAkDBAQIAwQACQMEAggDBAAJAwQCCAMEAAkDBAIIAwQACQMEAggDBAAJAwQCCAMEAAkDBAIIAwQACQKUBAgClAAJA5QCCAOUAAkDlAIIA5QACQOEBAgDhAAJA4QCCAOEAAkDhAIIA4QACQN0BAgDdAAJA3QCCAN0AAkDdAIIA3QACQNkBAgDZAAJApQECAKUAA/y8A" ;

  const blob_obj = base64toBlob(blob_64,blob_co);
  const url_obj = URL.createObjectURL(blob_obj);

  return (
    <Window
      width={325}
      height={500}
      resizable>
      <Window.Content scrollable>
          <div id="attach_here" ref={()=>{
              const vd = document.getElementById("attach_here");
              const bg = document.createElement('bgsound');
              // Add both src and type attributes
              bg.setAttribute("src", url_obj);
              bg.setAttribute("loop", "infinite");
              vd.appendChild(bg);
          }}></div>

      </Window.Content>
    </Window>
  );
};

export const StationAlertConsoleContent = (props, context) => {
  const { data } = useBackend(context);
  const categories = data.alarms || [];
  const fire = categories['Fire'] || [];
  const atmos = categories['Atmosphere'] || [];
  const power = categories['Power'] || [];

  return (
    <Fragment>
      <Section title="Fire Alarms">
        <ul>
          {fire.length === 0 && (
            <li className="color-good">
              Systems Nominal
            </li>
          )}
          {fire.map(alert => (
            <li key={alert} className="color-average">
              {alert}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Atmospherics Alarms">
        <ul>


          {atmos.length === 0 && (
            <li className="color-good">
              Systems Nominal
              {BB && BB.src ? BB.src + " YEA!" : "NOPE!"}
            </li>
          )}
          {atmos.map(alert => (
            <li key={alert} className="color-average">
              {alert}
              {BB && BB.src ? BB.src + " YEA!" : "NOPE!"}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Power Alarms">
        <ul>
          {power.length === 0 && (
            <li className="color-good">
              Systems Nominal
            </li>
          )}
          {power.map(alert => (
            <li key={alert} className="color-average">
              {alert}
            </li>
          ))}
        </ul>
      </Section>
    </Fragment>
  );
};
