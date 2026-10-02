# Content Guide — publish in under 2 minutes, no deploy

## Project (dashboard → Projects)
Required: title, image (<2MB, compressed client-side), 1-line description.
Recommended: live link + GitHub link, 3 tech chips, 3-5 features as
Problem → Action → Result bullets. Set `order_index` lowest = first,
`is_published = true` only when live link or code link works.

## Experience (dashboard → Experiences)
Title, company, start_date (end_date empty = Current), location,
employment_type (e.g. Internship), 2-3 quantified bullets in description,
skills as comma list (e.g. Python, SQL).

## Certificate (dashboard → Certificates)
Upload image, then fill issuer + issued date + verify URL when available.
Unverifiable certificates go last.

## CV (dashboard → CV Documents)
One active PDF, selectable text (not scanned image), filename
`Niko-Dwicahyo-CV-YYYY-MM.pdf`. View in dashboard before announcing.

## Comments
Pin max 2-3 real testimonials. Delete spam. Rate limits run server-side
(30s + 20/hour per IP) plus a 30s browser guard.
