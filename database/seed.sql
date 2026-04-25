-- QA Evaluation Platform Seed Data

-- Insert Users
INSERT INTO users (username, password_hash, role, full_name) VALUES 
('admin', '$2a$10$e3y6HGytbG61DqePTZ6g9O.bLc8N0v6CLD47DMzf6VUbvA3nCSfOe', 'admin', 'Administrator'),
('recteur', '$2a$10$NVdki8Vam3obHhjrhmo4FOwt4Bb.oH66uGTrR/RJ9n3sw9QYFF7ym', 'recteur', 'Recteur'),
('vrpd', '$2a$10$flWtH9ksSzkuwSpaUoS2ZOCsP72UozMTN5cUbleZsEH6/OexfQAJu', 'vrpd', 'Vice-Rector Pedagogy'),
('vrpg', '$2a$10$wOvo1jyQopcy8iSgFmP6g.aFIqs6FsBPojCMAiZzvEQ.cy0pMq.Y6', 'vrpg', 'Vice-Rector Post-Graduation'),
('vrel', '$2a$10$3l.StqXxJy3IJRalDPubX.B/zz/XqWr1pFMqISN6DVDOYFRBvkHPK', 'vrel', 'Vice-Rector External Relations'),
('vrplan', '$2a$10$6ENimSmpk6zGi754EnIWXuhw0F6MBTBjBUyobS1VOvUsl818Bq6e2', 'vrplan', 'Vice-Rector Planning'),
('sg', '$2a$10$xBcSKw7Xo.18TK2puT4Jtur8eK9FYBjfgzxl1gZrxO1uVo/OKl5xW', 'sg', 'General Secretary'),
('doyen', '$2a$10$d6Oka8rQRdqx1evnME5DdOEj1tNGgA/XlTJPPDvUvBVTmQrKeBffa', 'doyen', 'Dean'),
('chef_dep', '$2a$10$4SXxyACYA.vOp1j5Ck8AaeracZsEfoKxYviuPLwrKCWNruKWbdWwy', 'chef_dep', 'Head of Department');

-- Insert Domain 5 (id=1 explicitly)
INSERT INTO domains (id, domain_number, title, description) VALUES 
(1, 5, 'Vie dans les établissements d''ENSEIGNEMENT SUPÉRIEUR et la RECHERCHE SCIENTIFIQUE (ÉESRS)', 
'Qualité de vie dans les établissements d''enseignment supérieur et la recherche scientifique');

-- CHAMP V1, V2, V3 (ids 1, 2, 3 - all use domain_id=1)
INSERT INTO champs (id, domain_id, champ_code, title, sort_order) VALUES 
(1, 1, 'V1', 'ACCUEIL ET PRISE EN CHARGE DES ÉTUDIANTS ET DU PERSONNEL', 1),
(2, 1, 'V2', 'QUALITÉ DE VIE DANS LES ÉESRS', 2),
(3, 1, 'V3', 'ACTIVITÉS CULTURELLES ET SPORTIVES', 3);

-- REFS
-- V1.1, V1.2 use champ_id=1
-- V2.1, V2.2, V2.3 use champ_id=2  
-- V3.1, V3.2 use champ_id=3
INSERT INTO refs (id, champ_id, ref_code, title, description, sort_order) VALUES 
(1, 1, 'V1.1', 'Dispositif d''accueil, d''orientation et d''information', 'L''établissement met en place des dispositifs d''accueil, d''orientation et d''information des étudiants et du personnel', 1),
(2, 1, 'V1.2', 'Dispositif de communication', 'L''établissement met en place des dispositifs de communication pour les étudiants et le personnel', 2),
(3, 2, 'V2.1', 'Dispositif d''accompagnement social', 'L''établissement s''engage dans une démarche d''amélioration continue de la qualité de vie', 1),
(4, 2, 'V2.2', 'Service de soins et prévention', 'L''établissement assure l''accès à des services de soins et développe les actions de prévention', 2),
(5, 2, 'V2.3', 'Hygiène, Sécurité, Santé, Environnement', 'L''établissement garantit les conditions d''hygiène, de sécurité/santé et d''environnement', 3),
(6, 3, 'V3.1', 'Stratégie pour les activités culturelles et sportives', 'L''établissement développe une stratégie pour les activités culturelles et sportives', 1),
(7, 3, 'V3.2', 'Associations et clubs', 'L''établissement favorise le développement des clubs et d''associations culturelles et sportives', 2);

-- QUESTIONS (16 total)
-- refs 1,2 have questions 1-3
-- refs 3,4,5 have questions 4-12
-- refs 6,7 have questions 13-16
INSERT INTO questions (id, ref_id, question_code, question_text, sort_order) VALUES 
(1, 1, 'V1.1.1', 'Est-ce que l''établissement met en place un dispositif d''accueil et d''orientation ?', 1),
(2, 1, 'V1.1.2', 'Est-ce que l''établissement met en place un dispositif d''information ?', 2),
(3, 2, 'V1.2.1', 'Est-ce que l''établissement met en place un plan de communication ?', 1),
(4, 3, 'V2.1.1', 'Est-ce que en met en place un dispositif d''accompagnement social pour les membres de la famille universitaire ?', 1),
(5, 3, 'V2.1.2', 'Est-ce que l''établissement met en place un dispositif d''accompagnement psychologique ?', 2),
(6, 3, 'V2.1.3', 'Est-ce que l''établissement offre un espace convivial et un cadre de vie agréable ?', 3),
(7, 3, 'V2.1.4', 'Est-ce que l''établissement met en place des structures répondant au bien-être ?', 4),
(8, 3, 'V2.1.5', 'Est-ce que l''établissement met en place une structure accueillant les enfants de la communauté ?', 5),
(9, 3, 'V2.1.6', 'Est-ce que l''établissement dispose d''un bureau / distributeurs postaux ?', 6),
(10, 4, 'V2.2.1', 'Est-ce que l''établissement dispose d''un service chargé de la santé ?', 1),
(11, 4, 'V2.2.2', 'Est-ce que l''établissement développe et renforce les actions de prévention et d''éducation à la santé ?', 2),
(12, 5, 'V2.3.1', 'Est-ce que l''établissement assure des conditions d''Hygiène, Sécurité, Santé et Environnement (HSE) ?', 1),
(13, 6, 'V3.1.1', 'Est-ce que l''établissement met en place un dispositif qui encourage l''organisation des activités culturelles et sportives ?', 1),
(14, 6, 'V3.1.2', 'Est-ce que l''établissement organise des activités sportives variées ?', 2),
(15, 6, 'V3.1.3', 'Est-ce que l''établissement organise des activités culturelles et artistiques ?', 3),
(16, 7, 'V3.2.1', 'Est-ce que l''établissement encourage la création des associations culturelles et des clubs scientifiques et sportifs ?', 1);

-- QUESTION ROLES
INSERT INTO question_roles (question_id, role) VALUES 
(1, 'vrpd'), (1, 'doyen'), (1, 'chef_dep'),
(2, 'recteur'), (2, 'vrel'), (2, 'sg'),
(3, 'recteur'), (3, 'sg'), (3, 'vrplan'),
(4, 'sg'), (4, 'vrplan'),
(5, 'vrpd'), (5, 'vrpg'),
(6, 'sg'), (6, 'doyen'),
(7, 'sg'),
(8, 'sg'),
(9, 'sg'),
(10, 'vrpd'), (10, 'sg'),
(11, 'vrpd'), (11, 'vrpg'),
(12, 'sg'), (12, 'doyen'), (12, 'chef_dep'),
(13, 'vrpg'), (13, 'vrplan'), (13, 'vrel'),
(14, 'vrpg'), (14, 'vrel'),
(15, 'vrpg'), (15, 'vrel'),
(16, 'recteur'), (16, 'sg'), (16, 'vrpg');

-- PROOFS
INSERT INTO proofs (question_id, proof_text) VALUES 
(1, 'Bureau(x) d''accueil'),
(1, 'Procédure d''accueil formalisée'),
(1, 'Typologie du personnel'),
(2, 'Portail du site web'),
(2, 'Planning des événements'),
(3, 'Canaux de communication'),
(3, 'Réseaux sociaux'),
(4, 'Cellule d''œuvres sociales (COS)'),
(4, 'Cellule d''aide sociale pour les étudiants'),
(5, 'Cellule d''écoute psychologique'),
(6, 'Espace de détente'),
(7, 'Structures sportives'),
(8, 'Structure garde d''enfants'),
(9, 'Bureau postal'),
(10, 'Salles de soins'),
(10, 'Pharmacie'),
(11, 'Protocole sanitaire'),
(12, 'Organe HSE'),
(13, 'Structure culturelle/sportive'),
(14, 'Disciplines sportives'),
(15, 'Activités culturelles'),
(16, 'Liste des associations');
