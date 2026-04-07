/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#ifndef SENECA_ROGUE_H
#define SENECA_ROGUE_H

#include "characterTpl.h"
#include "weapons.h"
#include <iostream>

namespace seneca {

    template <typename T, typename FirstAbility_t, typename SecondAbility_t>
    class Rogue : public CharacterTpl<T> {
        int m_baseDefense{};
        int m_baseAttack{};
        FirstAbility_t m_firstAbility{};
        SecondAbility_t m_secondAbility{};
        seneca::Dagger m_weapon;

    public:
        Rogue(const char* name,
            int healthMax,
            int baseAttack,
            int baseDefense)
            : CharacterTpl<T>(name, healthMax),
            m_baseDefense(baseDefense),
            m_baseAttack(baseAttack),
            m_weapon() {
        }

        // Attack amount
        int getAttackAmnt() const override {
            double weaponDmg = static_cast<double>(m_weapon);
            return static_cast<int>(m_baseAttack + 2 * weaponDmg);
        }

        // Defense amount
        int getDefenseAmnt() const override {
            return m_baseDefense;
        }

        // Clone
        Character* clone() const override {
            return new Rogue(*this);
        }

        // Attack enemy
        void attack(Character* enemy) override {
            std::cout << this->getName()
                << " is attacking "
                << enemy->getName()
                << "."
                << std::endl;

            // Use both abilities on self
            m_firstAbility.useAbility(this);
            m_secondAbility.useAbility(this);

            int dmg = getAttackAmnt();

            // Enhance damage
            m_firstAbility.transformDamageDealt(dmg);
            m_secondAbility.transformDamageDealt(dmg);

            std::cout << "    Rogue deals "
                << dmg
                << " melee damage!"
                << std::endl;

            enemy->takeDamage(dmg);
        }

        // Take damage
        void takeDamage(int dmg) override {
            std::cout << this->getName()
                << " is attacked for "
                << dmg
                << " damage."
                << std::endl;

            std::cout << "    Rogue has a defense of "
                << m_baseDefense
                << ". Reducing damage received."
                << std::endl;

            // Reduce by defense
            dmg -= m_baseDefense;
            if (dmg < 0)
                dmg = 0;

            // Abilities reduce more
            m_firstAbility.transformDamageReceived(dmg);
            m_secondAbility.transformDamageReceived(dmg);

            // Call base
            CharacterTpl<T>::takeDamage(dmg);
        }
    };

}

#endif