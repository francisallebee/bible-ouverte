/**
 * Fond des écrans d'authentification.
 *
 * Reprend le vocabulaire visuel du hero de la page de présentation — marine
 * profond, halos colorés, trame de lignes — pour qu'on ne change pas d'univers
 * en passant de `/` à `/auth/signup`.
 *
 * Remplace la vidéo de fond, qui pesait 9 Mo à télécharger avant la première
 * connexion : le fond est désormais entièrement en CSS. Les animations sont
 * neutralisées par `prefers-reduced-motion` (voir globals.css).
 */
export default function AuthBackground() {
  return (
    <div aria-hidden className="fixed inset-0 bg-[#0a1626]">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[46rem] h-[46rem] rounded-full bg-[#1e3a5f] opacity-80 blur-[130px] bo-aurora" />
      <div
        className="absolute -bottom-48 -left-32 w-[38rem] h-[38rem] rounded-full bg-[#7b68ee] opacity-30 blur-[140px] bo-aurora"
        style={{ animationDelay: '-8s' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[34rem] h-[34rem] rounded-full bg-[#e9b949] opacity-[0.14] blur-[150px] bo-aurora"
        style={{ animationDelay: '-15s' }}
      />
      <div className="absolute inset-0 bo-grid" />
    </div>
  )
}
