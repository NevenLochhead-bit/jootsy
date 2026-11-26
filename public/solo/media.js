export function installSoloMedia(J, upload) {
  const {e, btn, S} = J;
  const externalMedia = window.renderMedia;
  window.renderMedia = card => card.media_kind === 'image' && card.media_url?.startsWith('/solo-media/') ?
    e('img', {src: card.media_url, class: 'card-media', alt: 'Image on this card', loading: 'lazy'}) : externalMedia(card);
  window.renderModel = card => {
    const source = card.model_mode === 'none' ? null : card.model_url || S.world?.default_model_url;
    if (!source) return null;
    const viewer = e('model-viewer', {src: source, 'camera-controls': true, 'touch-action': 'pan-y',
      'interaction-prompt': 'none', 'shadow-intensity': '.3', exposure: '1', class: 'solo-model',
      alt: 'Three-dimensional object on this card', loading: 'lazy'});
    const message = e('p', {class: 'solo-model-status', role: 'status'}, 'Loading 3D object…');
    viewer.addEventListener('load', () => {message.textContent = '';});
    viewer.addEventListener('error', () => {message.textContent = 'This model could not be displayed. Your saved file is available below.';});
    return e('div', {class: 'solo-model-wrap'}, viewer, message,
      e('a', {href: source, download: 'model.glb', class: 'solo-file-link'}, 'Download GLB'));
  };
  window.composerMedia = (initial = {}, onChange = () => {}) => {
    const state = {media_kind: initial.media_kind || null, media_url: initial.media_url || null,
      audio_url: initial.audio_url || null, video_url: initial.video_url || null,
      model_mode: initial.model_mode || 'inherit', model_url: initial.model_url || null};
    let busy = 0;
    const preview = e('div', {class: 'media-preview'}), error = e('p', {class: 'error', role: 'alert'});
    const raw = () => ({...state});
    const changed = () => {paint(); onChange();};
    function paint() {
      preview.replaceChildren();
      if (state.media_url) preview.append(window.renderMedia(state), btn('Remove image or link', () => {state.media_kind = null; state.media_url = null; changed();}, 'small-button'));
      if (state.video_url) preview.append(window.renderVideo(state), btn('Remove video', () => {state.video_url = null; changed();}, 'small-button'));
      if (state.audio_url) preview.append(window.renderSound(state), btn('Remove sound', () => {state.audio_url = null; changed();}, 'small-button'));
      if (state.model_mode === 'card') preview.append(window.renderModel(state), btn('Use project model', () => {state.model_mode = 'inherit'; state.model_url = null; changed();}, 'small-button'));
      if (state.model_mode === 'inherit' && S.world?.default_model_url) preview.append(e('p', {class: 'muted'}, 'Using the project’s 3D model.'));
    }
    const makeInput = (kind, accept, label) => {
      const input = e('input', {type: 'file', accept, hidden: true, 'aria-label': label,
        onchange: async () => {
          let file = input.files?.[0];
          if (!file) return;
          busy++;
          error.textContent = 'Saving file…';
          try {
            if (kind === 'image') {
              const bitmap = await createImageBitmap(file), scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(bitmap.width * scale));
              canvas.height = Math.max(1, Math.round(bitmap.height * scale));
              const context = canvas.getContext('2d');
              context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
              context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
              file = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .82));
              if (!file) throw Error('This image could not be prepared.');
            }
            const limit = kind === 'image' ? 1_500_000 : kind === 'audio' ? 2_000_000 : 4_000_000;
            if (file.size > limit) throw Error(`${label} must be under ${limit / 1_000_000} MB.`);
            const result = await upload(file, kind);
            if (kind === 'image') {state.media_kind = 'image'; state.media_url = result.url; state.video_url = null;}
            if (kind === 'video') {state.video_url = result.url; state.media_kind = null; state.media_url = null;}
            if (kind === 'audio') state.audio_url = result.url;
            if (kind === 'model') {state.model_mode = 'card'; state.model_url = result.url; modelChoice.value = 'card';}
            error.textContent = '';
            changed();
          } catch (err) {error.textContent = err.message;}
          finally {busy--; input.value = '';}
        }});
      return {input, button: btn(label, () => input.click())};
    };
    const image = makeInput('image', 'image/*', 'Add image');
    const audio = makeInput('audio', '.mp3,.m4a,audio/mpeg,audio/mp4', 'Add sound');
    const video = makeInput('video', '.mp4,video/mp4', 'Add video');
    const model = makeInput('model', '.glb,model/gltf-binary', 'Add GLB');
    const modelChoice = e('select', {'aria-label': '3D object on this card', onchange: () => {
      if (modelChoice.value === 'card' && !state.model_url) {modelChoice.value = state.model_mode; model.input.click(); return;}
      state.model_mode = modelChoice.value;
      changed();
    }}, e('option', {value: 'inherit'}, 'Use project model'), e('option', {value: 'card'}, 'Model on this card'), e('option', {value: 'none'}, 'No 3D object on this card'));
    modelChoice.value = state.model_mode;
    const linkInput = e('input', {type: 'url', placeholder: 'https://…', 'aria-label': 'Media link'});
    const linkRow = e('div', {class: 'solo-link-row', hidden: true}, linkInput, btn('Use link', () => {
      try {
        const url = new URL(linkInput.value);
        if (url.protocol !== 'https:') throw Error('Use a complete HTTPS media link.');
        state.media_kind = 'embed'; state.media_url = url.href; state.video_url = null;
        error.textContent = ''; linkRow.hidden = true; changed();
      } catch {error.textContent = 'Use a complete HTTPS media link.';}
    }));
    const link = btn('Add media link', () => {linkRow.hidden = !linkRow.hidden;if (!linkRow.hidden) linkInput.focus();});
    const element = e('div', {class: 'media-fields'}, e('div', {class: 'row'}, image.button, audio.button, video.button, model.button, link),
      image.input, audio.input, video.input, model.input, linkRow, e('label', {}, '3D object', modelChoice), preview, error);
    paint();
    return {element, raw, value: () => {if (busy) throw Error('Wait for the file to finish saving.');return raw();}};
  };
}
